import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
}

const riderIcon = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [ 25, 41 ],
    iconAnchor: [ 12, 41 ],
    popupAnchor: [ 1, -34 ],
    shadowSize: [ 41, 41 ]
})

const captainIcon = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [ 30, 48 ],
    iconAnchor: [ 15, 48 ],
    popupAnchor: [ 1, -38 ],
    shadowSize: [ 41, 41 ],
    className: 'hue-rotate-[160deg]'
})

const tripPointIcon = L.divIcon({
    className: 'trip-point-marker',
    html: '<div style="width:16px;height:16px;border-radius:9999px;background:#111827;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>',
    iconSize: [ 16, 16 ],
    iconAnchor: [ 8, 8 ]
})

const FollowMap = ({ focusPosition, autoFollow }) => {
    const map = useMap()

    useEffect(() => {
        if (!autoFollow || !focusPosition) {
            return
        }

        map.setView([ focusPosition.lat, focusPosition.lng ], Math.max(map.getZoom(), 14), {
            animate: true
        })
    }, [ autoFollow, focusPosition, map ])

    return null
}

const RouteLayer = ({ geometry, trackedPoints }) => {
    const map = useMap()
    const routeLayerRef = useRef(null)

    useEffect(() => {
        if (routeLayerRef.current) {
            map.removeLayer(routeLayerRef.current)
            routeLayerRef.current = null
        }

        if (geometry) {
            routeLayerRef.current = L.geoJSON(geometry, {
                style: { color: '#1d4ed8', weight: 5 }
            }).addTo(map)
        }

        const validPoints = trackedPoints
            .filter(Boolean)
            .map((point) => [ point.lat, point.lng ])

        if (validPoints.length > 1) {
            map.fitBounds(validPoints, { padding: [ 50, 50 ] })
        } else if (validPoints.length === 1) {
            map.setView(validPoints[0], Math.max(map.getZoom(), 14), { animate: true })
        }

        return () => {
            if (routeLayerRef.current) {
                map.removeLayer(routeLayerRef.current)
                routeLayerRef.current = null
            }
        }
    }, [ geometry, map, trackedPoints ])

    return null
}

const LiveTracking = ({ ride, trackedCaptainLocation, autoFollow = true, mapHeightClass = 'h-full' }) => {
    const [ currentPosition, setCurrentPosition ] = useState(defaultCenter)
    const [ pickupCoords, setPickupCoords ] = useState(null)
    const [ destinationCoords, setDestinationCoords ] = useState(null)
    const [ routeGeometry, setRouteGeometry ] = useState(null)

    useEffect(() => {
        let isMounted = true

        const updatePosition = (position) => {
            if (!isMounted) {
                return
            }

            setCurrentPosition({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            })
        }

        const handleError = (error) => {
            console.error('Unable to fetch location:', error)
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
                enableHighAccuracy: true
            })
        }

        const watchId = navigator.geolocation?.watchPosition(updatePosition, handleError, {
            enableHighAccuracy: true,
            maximumAge: 0
        })

        return () => {
            isMounted = false
            if (watchId != null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId)
            }
        }
    }, [])

    useEffect(() => {
        let ignore = false

        const loadTripDetails = async () => {
            if (!ride?.pickup || !ride?.destination) {
                setPickupCoords(null)
                setDestinationCoords(null)
                setRouteGeometry(null)
                return
            }

            try {
                const geocode = async (address) => {
                    const response = await fetch(`/maps/get-coordinates?address=${encodeURIComponent(address)}`)
                    if (!response.ok) {
                        return null
                    }

                    const data = await response.json()
                    if (typeof data?.ltd !== 'number' || typeof data?.lng !== 'number') {
                        return null
                    }

                    return { lat: data.ltd, lng: data.lng }
                }

                const pickupPoint = await geocode(ride.pickup)
                const destinationPoint = await geocode(ride.destination)

                if (ignore) {
                    return
                }

                setPickupCoords(pickupPoint)
                setDestinationCoords(destinationPoint)

                if (pickupPoint && destinationPoint) {
                    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupPoint.lng},${pickupPoint.lat};${destinationPoint.lng},${destinationPoint.lat}?overview=full&geometries=geojson`
                    const routeResponse = await fetch(osrmUrl)
                    const routeData = await routeResponse.json()

                    if (!ignore) {
                        setRouteGeometry(routeData?.routes?.[0]?.geometry ?? null)
                    }
                }
            } catch (error) {
                if (!ignore) {
                    setRouteGeometry(null)
                }
                console.error('Failed to fetch route:', error)
            }
        }

        loadTripDetails()

        return () => {
            ignore = true
        }
    }, [ ride?.pickup, ride?.destination ])

    const captainPosition = useMemo(() => {
        if (trackedCaptainLocation?.lat && trackedCaptainLocation?.lng) {
            return trackedCaptainLocation
        }

        const rideCaptainLocation = ride?.captain?.location
        if (typeof rideCaptainLocation?.ltd === 'number' && typeof rideCaptainLocation?.lng === 'number') {
            return {
                lat: rideCaptainLocation.ltd,
                lng: rideCaptainLocation.lng
            }
        }

        return null
    }, [ ride?.captain?.location, trackedCaptainLocation ])

    const focusPosition = captainPosition || currentPosition

    const trackedPoints = useMemo(() => {
        return [
            currentPosition,
            captainPosition,
            pickupCoords,
            destinationCoords
        ]
    }, [ captainPosition, currentPosition, destinationCoords, pickupCoords ])

    return (
        <MapContainer
            center={[ focusPosition.lat, focusPosition.lng ]}
            zoom={15}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={true}
            touchZoom={true}
            className={`${mapHeightClass} w-full relative z-0`}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <FollowMap focusPosition={focusPosition} autoFollow={autoFollow} />
            <RouteLayer geometry={routeGeometry} trackedPoints={trackedPoints} />

            <Marker position={[ currentPosition.lat, currentPosition.lng ]} icon={riderIcon}>
                <Popup>Your location</Popup>
            </Marker>

            {captainPosition && (
                <Marker position={[ captainPosition.lat, captainPosition.lng ]} icon={captainIcon}>
                    <Popup>Driver location</Popup>
                </Marker>
            )}

            {pickupCoords && (
                <Marker position={[ pickupCoords.lat, pickupCoords.lng ]} icon={tripPointIcon}>
                    <Popup>Pickup</Popup>
                </Marker>
            )}

            {destinationCoords && (
                <Marker position={[ destinationCoords.lat, destinationCoords.lng ]} icon={tripPointIcon}>
                    <Popup>Destination</Popup>
                </Marker>
            )}
        </MapContainer>
    )
}

export default LiveTracking
