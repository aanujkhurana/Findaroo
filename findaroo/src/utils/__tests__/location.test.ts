import { calculateDistance } from '../location';

describe('Location Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Test with known coordinates (San Francisco to Los Angeles)
      const sanFrancisco = {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA'
      };
      
      const losAngeles = {
        latitude: 34.0522,
        longitude: -118.2437,
        address: 'Los Angeles, CA'
      };
      
      const distance = calculateDistance(sanFrancisco, losAngeles);
      
      // Distance should be approximately 559 km
      expect(distance).toBeGreaterThan(550);
      expect(distance).toBeLessThan(570);
    });

    it('should return 0 for same coordinates', () => {
      const point = {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA'
      };
      
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });

    it('should handle small distances correctly', () => {
      const point1 = {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'Point 1'
      };
      
      const point2 = {
        latitude: 37.7750, // Very small difference
        longitude: -122.4195,
        address: 'Point 2'
      };
      
      const distance = calculateDistance(point1, point2);
      
      // Should be a very small distance (less than 1 km)
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1);
    });
  });
});
