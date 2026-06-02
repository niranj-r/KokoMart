export const STORE_LOCATION = {
    latitude: 8.5461454,
    longitude: 76.9046489, // Pincode 695016 base location
};

// Haversine formula to calculate straight-line distance between two points
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const calculateDeliveryTime = (distanceKm: number, skipRoadMultiplier: boolean = false): number => {
    // If skipRoadMultiplier is true (e.g. actual road distance), we don't apply the curvature factor
    const roadDistance = skipRoadMultiplier ? distanceKm : distanceKm * 1.4;

    const baseTime = 30; // 30 mins for first 7 km
    const baseDistance = 7;

    if (roadDistance <= baseDistance) {
        return baseTime;
    }

    const extraDistance = roadDistance - baseDistance;
    const extraTime = Math.ceil(extraDistance) * 3; // 3 mins per extra km

    return baseTime + extraTime;
};

export interface GoogleDistanceData {
    distanceKm: number;
    durationMins: number;
}

/**
 * Calls Google Routes API v2 to calculate driving distance along road networks.
 * Returns null if API call fails or if no route can be resolved.
 */
export const getGoogleMapsDistance = async (
    userLat: number,
    userLon: number,
    storeLat: number,
    storeLon: number,
    apiKey: string
): Promise<GoogleDistanceData | null> => {
    try {
        if (!apiKey) {
            console.warn('[GoogleMapsDistance] Google API key is missing.');
            return null;
        }

        const response = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,status,condition,distanceMeters,duration',
            },
            body: JSON.stringify({
                origins: [{ waypoint: { location: { latLng: { latitude: userLat, longitude: userLon } } } }],
                destinations: [{ waypoint: { location: { latLng: { latitude: storeLat, longitude: storeLon } } } }],
                travelMode: 'DRIVE',
                routingPreference: 'TRAFFIC_AWARE',
            }),
        });

        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = 'Could not read response error body';
            }
            console.error('[GoogleMapsDistance] Routes API HTTP error status:', response.status, 'Body:', errorText);
            return null;
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            console.warn('[GoogleMapsDistance] Routes API returned empty or invalid matrix.');
            return null;
        }

        const result = data[0];
        if (!result || result.condition === 'ROUTE_NOT_FOUND') {
            console.warn('[GoogleMapsDistance] Route not found between origin and destination.');
            return null;
        }

        // If the element status specifies an error (e.g. invalid locations)
        if (result.status && result.status.code && result.status.code !== 0) {
            console.error('[GoogleMapsDistance] Route element error status:', result.status);
            return null;
        }

        const distanceMeters = result.distanceMeters;
        // In proto3 JSON, 0 is default and can be omitted. If condition is ROUTE_EXISTS, distance is 0.
        const distanceKm = distanceMeters !== undefined ? distanceMeters / 1000 : 0;
        
        let durationMins = 0;
        if (result.duration) {
            const seconds = parseFloat(result.duration.replace('s', ''));
            if (!isNaN(seconds)) {
                durationMins = Math.ceil(seconds / 60);
            }
        }

        return {
            distanceKm,
            durationMins,
        };
    } catch (error) {
        console.error('[GoogleMapsDistance] Fetch failed:', error);
        return null;
    }
};
