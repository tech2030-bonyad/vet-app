"""
Order service layer containing business logic for order management.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from fastapi import HTTPException, status

from ..models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, DeliveryStatus
from ..schemas.order import (
    OrderCreate, OrderUpdate, OrderCancellation, OrderFilters,
    TrackingUpdate, OrderSummary
)
from ..utils.order_tracking import OrderTrackingService
from ..utils.email_service import EmailService
from ..utils.order_number_generator import generate_order_number

logger = logging.getLogger(__name__)


class OrderService:
    """Service class for order management operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.tracking_service = OrderTrackingService()
        self.email_service = EmailService()
    
    def create_order(self, user_id: UUID, order_data: OrderCreate) -> Order:
        """
        Create a new order with items.
        
        Args:
            user_id: ID of the user creating the order
            order_data: Order creation data
            
        Returns:
            Created order instance
            
        Raises:
            HTTPException: If order creation fails
        """
        try:
            # Calculate total amount
            total_amount = sum(
                item.quantity * item.unit_price for item in order_data.items
            ) + order_data.shipping_cost
            
            # Generate unique order number
            order_number = generate_order_number()
            
            # Create order
            order = Order(
                order_number=order_number,
                user_id=user_id,
                total_amount=total_amount,
                currency=order_data.currency,
                shipping_address=order_data.shipping_address,
                billing_address=order_data.billing_address,
                shipping_method=order_data.shipping_method,
                shipping_cost=order_data.shipping_cost,
                notes=order_data.notes
            )
            
            self.db.add(order)
            self.db.flush()  # Get order ID
            
            # Create order items
            for item_data in order_data.items:
                total_price = item_data.quantity * item_data.unit_price
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item_data.product_id,
                    product_name=item_data.product_name,
                    product_sku=item_data.product_sku,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    total_price=total_price,
                    product_variant=item_data.product_variant,
                    product_options=item_data.product_options
                )
                self.db.add(order_item)
            
            # Create initial status history
            self._add_status_history(
                order.id,
                None,
                OrderStatus.PENDING,
                user_id,
                "Order created"
            )
            
            self.db.commit()
            self.db.refresh(order)
            
            # Send order confirmation email
            self._send_order_notification(order, "order_created")
            
            logger.info(f"Order created successfully: {order.order_number}")
            return order
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create order: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create order"
            )
    
    def get_order_by_id(self, order_id: UUID, user_id: Optional[UUID] = None) -> Optional[Order]:
        """
        Get order by ID with optional user filtering.
        
        Args:
            order_id: Order ID
            user_id: Optional user ID for filtering
            
        Returns:
            Order instance or None if not found
        """
        query = self.db.query(Order).filter(Order.id == order_id)
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        return query.first()
    
    def get_order_by_number(self, order_number: str, user_id: Optional[UUID] = None) -> Optional[Order]:
        """
        Get order by order number with optional user filtering.
        
        Args:
            order_number: Order number
            user_id: Optional user ID for filtering
            
        Returns:
            Order instance or None if not found
        """
        query = self.db.query(Order).filter(Order.order_number == order_number)
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        return query.first()
    
    def get_user_orders(
        self,
        user_id: UUID,
        filters: Optional[OrderFilters] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Order], int]:
        """
        Get paginated orders for a user with optional filtering.
        
        Args:
            user_id: User ID
            filters: Optional filters
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple of (orders list, total count)
        """
        query = self.db.query(Order).filter(Order.user_id == user_id)
        
        # Apply filters
        if filters:
            if filters.status:
                query = query.filter(Order.status == filters.status)
            
            if filters.delivery_status:
                query = query.filter(Order.delivery_status == filters.delivery_status)
            
            if filters.date_from:
                query = query.filter(Order.created_at >= filters.date_from)
            
            if filters.date_to:
                query = query.filter(Order.created_at <= filters.date_to)
            
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        Order.order_number.ilike(search_term),
                        Order.notes.ilike(search_term)
                    )
                )
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        orders = (
            query.order_by(desc(Order.created_at))
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        
        return orders, total
    
    def update_order_status(
        self,
        order_id: UUID,
        new_status: OrderStatus,
        changed_by: Optional[UUID] = None,
        reason: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Order:
        """
        Update order status and create history entry.
        
        Args:
            order_id: Order ID
            new_status: New order status
            changed_by: User ID who made the change
            reason: Reason for status change
            notes: Additional notes
            
        Returns:
            Updated order instance
            
        Raises:
            HTTPException: If order not found or update fails
        """
        order = self.get_order_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.is_cancelled and new_status != OrderStatus.REFUNDED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update status of cancelled order"
            )
        
        try:
            previous_status = order.status
            order.status = new_status
            order.updated_at = datetime.utcnow()
            
            # Update delivery status based on order status
            if new_status == OrderStatus.SHIPPED:
                order.delivery_status = DeliveryStatus.IN_TRANSIT
            elif new_status == OrderStatus.OUT_FOR_DELIVERY:
                order.delivery_status = DeliveryStatus.OUT_FOR_DELIVERY
            elif new_status == OrderStatus.DELIVERED:
                order.delivery_status = DeliveryStatus.DELIVERED
                order.actual_delivery_date = datetime.utcnow()
            
            # Add status history
            self._add_status_history(
                order_id,
                previous_status,
                new_status,
                changed_by,
                reason,
                notes
            )
            
            self.db.commit()
            self.db.refresh(order)
            
            # Send status update notification
            self._send_order_notification(order, "status_updated")
            
            logger.info(f"Order status updated: {order.order_number} -> {new_status}")
            return order
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update order status: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update order status"
            )
    
    def update_delivery_tracking(
        self,
        order_id: UUID,
        tracking_update: TrackingUpdate,
        updated_by: Optional[UUID] = None
    ) -> Order:
        """
        Update delivery tracking information.
        
        Args:
            order_id: Order ID
            tracking_update: Tracking update data
            updated_by: User ID who made the update
            
        Returns:
            Updated order instance
            
        Raises:
            HTTPException: If order not found or update fails
        """
        order = self.get_order_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        try:
            # Update tracking information
            order.tracking_number = tracking_update.tracking_number
            order.carrier = tracking_update.carrier
            order.delivery_status = tracking_update.status
            
            if tracking_update.estimated_delivery:
                order.estimated_delivery_date = tracking_update.estimated_delivery
            
            if tracking_update.status == DeliveryStatus.DELIVERED:
                order.actual_delivery_date = datetime.utcnow()
                order.status = OrderStatus.DELIVERED
            
            order.updated_at = datetime.utcnow()
            
            # Add tracking history
            self._add_status_history(
                order_id,
                None,
                order.status,
                updated_by,
                "Delivery tracking updated",
                tracking_update.notes,
                tracking_update.status,
                tracking_update.tracking_details,
                tracking_update.location
            )
            
            self.db.commit()
            self.db.refresh(order)
            
            # Send tracking update notification
            self._send_order_notification(order, "tracking_updated")
            
            logger.info(f"Delivery tracking updated: {order.order_number}")
            return order
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update delivery tracking: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update delivery tracking"
            )
    
    def cancel_order(
        self,
        order_id: UUID,
        cancellation: OrderCancellation,
        cancelled_by: UUID
    ) -> Order:
        """
        Cancel an order.
        
        Args:
            order_id: Order ID
            cancellation: Cancellation data
            cancelled_by: User ID who cancelled the order
            
        Returns:
            Cancelled order instance
            
        Raises:
            HTTPException: If order not found or cannot be cancelled
        """
        order = self.get_order_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.is_cancelled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is already cancelled"
            )
        
        if order.status in [OrderStatus.DELIVERED, OrderStatus.REFUNDED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel delivered or refunded order"
            )
        
        try:
            previous_status = order.status
            order.status = OrderStatus.CANCELLED
            order.is_cancelled = True
            order.cancellation_reason = cancellation.reason
            order.cancelled_at = datetime.utcnow()
            order.updated_at = datetime.utcnow()
            
            # Add cancellation history
            self._add_status_history(
                order_id,
                previous_status,
                OrderStatus.CANCELLED,
                cancelled_by,
                "Order cancelled",
                cancellation.reason
            )
            
            self.db.commit()
            self.db.refresh(order)
            
            # Send cancellation notification
            self._send_order_notification(order, "order_cancelled")
            
            logger.info(f"Order cancelled: {order.order_number}")
            return order
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to cancel order: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel order"
            )
    
    def get_order_summary(self, user_id: Optional[UUID] = None) -> OrderSummary:
        """
        Get order summary statistics.
        
        Args:
            user_id: Optional user ID for user-specific summary
            
        Returns:
            Order summary statistics
        """
        query = self.db.query(Order)
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        # Get status counts
        status_counts = (
            query.with_entities(Order.status, func.count(Order.id))
            .group_by(Order.status)
            .all()
        )
        
        status_dict = dict(status_counts)
        
        # Calculate revenue
        total_revenue = (
            query.filter(Order.status.in_([
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.OUT_FOR_DELIVERY,
                OrderStatus.DELIVERED
            ]))
            .with_entities(func.sum(Order.total_amount))
            .scalar() or Decimal('0.00')
        )
        
        total_orders = sum(status_dict.values())
        average_order_value = (
            total_revenue / total_orders if total_orders > 0 else Decimal('0.00')
        )
        
        return OrderSummary(
            total_orders=total_orders,
            pending_orders=status_dict.get(OrderStatus.PENDING, 0),
            processing_orders=status_dict.get(OrderStatus.PROCESSING, 0),
            shipped_orders=status_dict.get(OrderStatus.SHIPPED, 0),
            delivered_orders=status_dict.get(OrderStatus.DELIVERED, 0),
            cancelled_orders=status_dict.get(OrderStatus.CANCELLED, 0),
            total_revenue=total_revenue,
            average_order_value=average_order_value
        )
    
    def _add_status_history(
        self,
        order_id: UUID,
        previous_status: Optional[OrderStatus],
        new_status: OrderStatus,
        changed_by: Optional[UUID],
        reason: Optional[str] = None,
        notes: Optional[str] = None,
        delivery_status: Optional[DeliveryStatus] = None,
        tracking_info: Optional[Dict[str, Any]] = None,
        location: Optional[str] = None
    ) -> None:
        """Add entry to order status history."""
        history = OrderStatusHistory(
            order_id=order_id,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=changed_by,
            change_reason=reason,
            notes=notes,
            delivery_status=delivery_status,
            tracking_info=tracking_info,
            location=location
        )
        self.db.add(history)
    
    def _send_order_notification(self, order: Order, notification_type: str) -> None:
        """Send email notification for order updates."""
        try:
            self.email_service.send_order_notification(
                order=order,
                notification_type=notification_type
            )
        except Exception as e:
            logger.error(f"Failed to send order notification: {str(e)}")
            # Don't raise exception as email failure shouldn't break order operations