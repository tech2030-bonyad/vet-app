"""
Stripe client utility for payment processing.
"""
import os
import logging
from typing import Optional, Dict, Any
import stripe
from decimal import Decimal

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


class StripeClient:
    """Stripe client wrapper for payment operations."""
    
    def __init__(self):
        """Initialize Stripe client."""
        if not stripe.api_key:
            raise ValueError("STRIPE_SECRET_KEY environment variable is required")
        
        self.webhook_secret = STRIPE_WEBHOOK_SECRET
        logger.info("Stripe client initialized successfully")
    
    async def create_payment_intent(
        self,
        amount: Decimal,
        currency: str = "usd",
        metadata: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        customer_id: Optional[str] = None
    ) -> stripe.PaymentIntent:
        """
        Create a Stripe payment intent.
        
        Args:
            amount: Payment amount in dollars
            currency: Payment currency (default: usd)
            metadata: Additional metadata
            description: Payment description
            customer_id: Stripe customer ID
            
        Returns:
            Stripe PaymentIntent object
            
        Raises:
            stripe.error.StripeError: If payment intent creation fails
        """
        try:
            # Convert amount to cents
            amount_cents = int(amount * 100)
            
            payment_intent_data = {
                "amount": amount_cents,
                "currency": currency,
                "automatic_payment_methods": {"enabled": True},
            }
            
            if metadata:
                payment_intent_data["metadata"] = metadata
            
            if description:
                payment_intent_data["description"] = description
            
            if customer_id:
                payment_intent_data["customer"] = customer_id
            
            payment_intent = stripe.PaymentIntent.create(**payment_intent_data)
            
            logger.info(f"Payment intent created: {payment_intent.id}")
            return payment_intent
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create payment intent: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating payment intent: {str(e)}")
            raise
    
    async def confirm_payment_intent(
        self,
        payment_intent_id: str,
        payment_method_id: Optional[str] = None
    ) -> stripe.PaymentIntent:
        """
        Confirm a payment intent.
        
        Args:
            payment_intent_id: Stripe payment intent ID
            payment_method_id: Payment method ID (optional)
            
        Returns:
            Confirmed PaymentIntent object
            
        Raises:
            stripe.error.StripeError: If confirmation fails
        """
        try:
            confirm_data = {}
            if payment_method_id:
                confirm_data["payment_method"] = payment_method_id
            
            payment_intent = stripe.PaymentIntent.confirm(
                payment_intent_id,
                **confirm_data
            )
            
            logger.info(f"Payment intent confirmed: {payment_intent_id}")
            return payment_intent
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to confirm payment intent {payment_intent_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error confirming payment intent: {str(e)}")
            raise
    
    async def retrieve_payment_intent(self, payment_intent_id: str) -> stripe.PaymentIntent:
        """
        Retrieve a payment intent by ID.
        
        Args:
            payment_intent_id: Stripe payment intent ID
            
        Returns:
            PaymentIntent object
            
        Raises:
            stripe.error.StripeError: If retrieval fails
        """
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return payment_intent
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve payment intent {payment_intent_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error retrieving payment intent: {str(e)}")
            raise
    
    async def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> stripe.Refund:
        """
        Create a refund for a payment.
        
        Args:
            payment_intent_id: Stripe payment intent ID
            amount: Refund amount in dollars (full refund if None)
            reason: Refund reason
            metadata: Additional metadata
            
        Returns:
            Stripe Refund object
            
        Raises:
            stripe.error.StripeError: If refund creation fails
        """
        try:
            refund_data = {"payment_intent": payment_intent_id}
            
            if amount is not None:
                # Convert amount to cents
                refund_data["amount"] = int(amount * 100)
            
            if reason:
                refund_data["reason"] = reason
            
            if metadata:
                refund_data["metadata"] = metadata
            
            refund = stripe.Refund.create(**refund_data)
            
            logger.info(f"Refund created: {refund.id} for payment intent: {payment_intent_id}")
            return refund
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create refund for {payment_intent_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating refund: {str(e)}")
            raise
    
    async def retrieve_refund(self, refund_id: str) -> stripe.Refund:
        """
        Retrieve a refund by ID.
        
        Args:
            refund_id: Stripe refund ID
            
        Returns:
            Refund object
            
        Raises:
            stripe.error.StripeError: If retrieval fails
        """
        try:
            refund = stripe.Refund.retrieve(refund_id)
            return refund
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve refund {refund_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error retrieving refund: {str(e)}")
            raise
    
    def construct_webhook_event(self, payload: bytes, signature: str) -> stripe.Event:
        """
        Construct and verify a webhook event.
        
        Args:
            payload: Raw webhook payload
            signature: Stripe signature header
            
        Returns:
            Verified Stripe Event object
            
        Raises:
            stripe.error.SignatureVerificationError: If signature verification fails
        """
        try:
            if not self.webhook_secret:
                raise ValueError("STRIPE_WEBHOOK_SECRET is not configured")
            
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            logger.info(f"Webhook event verified: {event['type']}")
            return event
            
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error constructing webhook event: {str(e)}")
            raise


# Global Stripe client instance
stripe_client = StripeClient()