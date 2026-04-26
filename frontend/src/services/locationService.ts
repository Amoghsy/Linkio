import { mapService, type GeoPoint } from "./mapService";
import { userService } from "./userService";

export const locationService = {
  resolveCurrentLocation: (): Promise<GeoPoint> => mapService.getCurrentLocation(),

  syncCustomerLocation: async (userId: string): Promise<GeoPoint> => {
    const location = await mapService.getCurrentLocation();
    await userService.updateUser(userId, {
      location,
      lat: location.lat,
      lng: location.lng,
    });
    return location;
  },

  syncWorkerLocation: async (workerId: string): Promise<GeoPoint> => {
    const location = await mapService.getCurrentLocation();
    await userService.updateWorker(workerId, {
      location,
      lat: location.lat,
      lng: location.lng,
    });
    return location;
  },
};
