"""
Location utilities for distance calculations and geographic operations.
"""
import math
from typing import Tuple, List, Dict, Any
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import logging

logger = logging.getLogger(__name__)

class LocationUtils:
    """Utility class for location-based operations."""
    
    def __init__(self):
        """Initialize the location utilities."""
        self.geocoder = Nominatim(user_agent="clinic_management_api")
    
    @staticmethod
    def calculate_distance_km(
        lat1: float, 
        lon1: float, 
        lat2: float, 
        lon2: float
    ) -> float:
        """
        Calculate the distance between two points using the Haversine formula.
        
        Args:
            lat1: Latitude of first point
            lon1: Longitude of first point
            lat2: Latitude of second point
            lon2: Longitude of second point
            
        Returns:
            Distance in kilometers
        """
        try:
            # Using geopy for accurate distance calculation
            point1 = (lat1, lon1)
            point2 = (lat2, lon2)
            distance = geodesic(point1, point2).kilometers
            return round(distance, 2)
        except Exception as e:
            logger.error(f"Error calculating distance: {e}")
            # Fallback to Haversine formula
            return LocationUtils._haversine_distance(lat1, lon1, lat2, lon2)
    
    @staticmethod
    def _haversine_distance(
        lat1: float, 
        lon1: float, 
        lat2: float, 
        lon2: float
    ) -> float:
        """
        Calculate distance using Haversine formula as fallback.
        
        Args:
            lat1: Latitude of first point
            lon1: Longitude of first point
            lat2: Latitude of second point
            lon2: Longitude of second point
            
        Returns:
            Distance in kilometers
        """
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of Earth in kilometers
        r = 6371
        
        return round(c * r, 2)
    
    @staticmethod
    def is_within_radius(
        center_lat: float,
        center_lon: float,
        point_lat: float,
        point_lon: float,
        radius_km: float
    ) -> bool:
        """
        Check if a point is within a given radius of a center point.
        
        Args:
            center_lat: Latitude of center point
            center_lon: Longitude of center point
            point_lat: Latitude of point to check
            point_lon: Longitude of point to check
            radius_km: Radius in kilometers
            
        Returns:
            True if point is within radius, False otherwise
        """
        distance = LocationUtils.calculate_distance_km(
            center_lat, center_lon, point_lat, point_lon
        )
        return distance <= radius_km
    
    @staticmethod
    def get_bounding_box(
        center_lat: float,
        center_lon: float,
        radius_km: float
    ) -> Tuple[float, float, float, float]:
        """
        Calculate bounding box coordinates for a given center point and radius.
        This is useful for database queries to filter locations before calculating exact distances.
        
        Args:
            center_lat: Latitude of center point
            center_lon: Longitude of center point
            radius_km: Radius in kilometers
            
        Returns:
            Tuple of (min_lat, max_lat, min_lon, max_lon)
        """
        # Approximate degrees per kilometer
        lat_degree_km = 111.0  # 1 degree latitude ≈ 111 km
        lon_degree_km = 111.0 * math.cos(math.radians(center_lat))  # Varies by latitude
        
        lat_delta = radius_km / lat_degree_km
        lon_delta = radius_km / lon_degree_km
        
        min_lat = center_lat - lat_delta
        max_lat = center_lat + lat_delta
        min_lon = center_lon - lon_delta
        max_lon = center_lon + lon_delta
        
        return (min_lat, max_lat, min_lon, max_lon)
    
    def geocode_address(self, address: str) -> Tuple[float, float]:
        """
        Convert an address to latitude and longitude coordinates.
        
        Args:
            address: Address string to geocode
            
        Returns:
            Tuple of (latitude, longitude)
            
        Raises:
            ValueError: If address cannot be geocoded
        """
        try:
            location = self.geocoder.geocode(address, timeout=10)
            if location:
                return (location.latitude, location.longitude)
            else:
                raise ValueError(f"Could not geocode address: {address}")
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Geocoding service error: {e}")
            raise ValueError(f"Geocoding service unavailable: {e}")
        except Exception as e:
            logger.error(f"Unexpected geocoding error: {e}")
            raise ValueError(f"Failed to geocode address: {e}")
    
    def reverse_geocode(self, latitude: float, longitude: float) -> str:
        """
        Convert latitude and longitude coordinates to an address.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Address string
            
        Raises:
            ValueError: If coordinates cannot be reverse geocoded
        """
        try:
            location = self.geocoder.reverse(
                (latitude, longitude), 
                timeout=10,
                exactly_one=True
            )
            if location:
                return location.address
            else:
                raise ValueError(f"Could not reverse geocode coordinates: {latitude}, {longitude}")
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.error(f"Reverse geocoding service error: {e}")
            raise ValueError(f"Reverse geocoding service unavailable: {e}")
        except Exception as e:
            logger.error(f"Unexpected reverse geocoding error: {e}")
            raise ValueError(f"Failed to reverse geocode coordinates: {e}")
    
    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> bool:
        """
        Validate latitude and longitude coordinates.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            True if coordinates are valid, False otherwise
        """
        return (
            -90 <= latitude <= 90 and
            -180 <= longitude <= 180
        )
    
    @staticmethod
    def sort_by_distance(
        locations: List[Dict[str, Any]],
        center_lat: float,
        center_lon: float,
        lat_key: str = 'latitude',
        lon_key: str = 'longitude'
    ) -> List[Dict[str, Any]]:
        """
        Sort a list of locations by distance from a center point.
        
        Args:
            locations: List of location dictionaries
            center_lat: Latitude of center point
            center_lon: Longitude of center point
            lat_key: Key for latitude in location dictionaries
            lon_key: Key for longitude in location dictionaries
            
        Returns:
            Sorted list of locations with distance added
        """
        for location in locations:
            distance = LocationUtils.calculate_distance_km(
                center_lat,
                center_lon,
                location[lat_key],
                location[lon_key]
            )
            location['distance_km'] = distance
        
        return sorted(locations, key=lambda x: x['distance_km'])
    
    @staticmethod
    def filter_by_radius(
        locations: List[Dict[str, Any]],
        center_lat: float,
        center_lon: float,
        radius_km: float,
        lat_key: str = 'latitude',
        lon_key: str = 'longitude'
    ) -> List[Dict[str, Any]]:
        """
        Filter locations within a given radius from a center point.
        
        Args:
            locations: List of location dictionaries
            center_lat: Latitude of center point
            center_lon: Longitude of center point
            radius_km: Radius in kilometers
            lat_key: Key for latitude in location dictionaries
            lon_key: Key for longitude in location dictionaries
            
        Returns:
            Filtered list of locations within radius
        """
        filtered_locations = []
        
        for location in locations:
            if LocationUtils.is_within_radius(
                center_lat,
                center_lon,
                location[lat_key],
                location[lon_key],
                radius_km
            ):
                distance = LocationUtils.calculate_distance_km(
                    center_lat,
                    center_lon,
                    location[lat_key],
                    location[lon_key]
                )
                location['distance_km'] = distance
                filtered_locations.append(location)
        
        return filtered_locations

# Singleton instance
location_utils = LocationUtils()