import React, { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
}

const markerIconConfig = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const RecenterMap = ({ position }) => {
    const map = useMap()

    useEffect(() => {
        map.setView(position, map.getZoom(), {
            animate: true
        })
    }, [ map, position ])

    return null
}

const RouteLayer = ({ geometry, pickup, dest }) => {
    const map = useMap()

    useEffect(() => {
        if (!geometry) return

        const layer = L.geoJSON(geometry, {
            style: { color: 'blue', weight: 5 }
        }).addTo(map)

        if (pickup && dest) {
            const bounds = L.latLngBounds([ [ pickup.lat, pickup.lng ], [ dest.lat, dest.lng ] ])
            map.fitBounds(bounds, { padding: [50, 50] })
        }

        return () => {
            map.removeLayer(layer)
        }
    }, [ map, geometry, pickup, dest ])

    return null
}

const LiveTracking = ({ ride }) => {
    const [ currentPosition, setCurrentPosition ] = useState(defaultCenter)
    const [ routeGeometry, setRouteGeometry ] = useState(null)
    const [ pickupCoords, setPickupCoords ] = useState(null)
    const [ destCoords, setDestCoords ] = useState(null)

    useEffect(() => {
        // If a ride is provided, geocode pickup/destination and fetch route
        if (ride && ride.pickup && ride.destination) {
            (async () => {
                try {
                    const geocode = async (address) => {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
                        const data = await res.json()
                        if (!data || data.length === 0) return null
                        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
                    }

                    const p = await geocode(ride.pickup)
                    const d = await geocode(ride.destination)
                    if (p && d) {
                        setPickupCoords(p)
                        setDestCoords(d)
                        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`
                        const r = await fetch(osrmUrl)
                        const jr = await r.json()
                        if (jr && jr.routes && jr.routes.length > 0) {
                            setRouteGeometry(jr.routes[0].geometry)
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch route:', err)
                }
            })()
        }

        if (!navigator.geolocation) {
            return undefined
        }

        const updatePosition = (position) => {
            const { latitude, longitude } = position.coords

            setCurrentPosition({
                lat: latitude,
                lng: longitude
            })
        }

        const handleError = (error) => {
            console.error('Unable to fetch location:', error)
        }

        navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
            enableHighAccuracy: true
        })

        const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
            enableHighAccuracy: true,
            maximumAge: 0
        })

        const intervalId = window.setInterval(() => {
            navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
                enableHighAccuracy: true
            })
        }, 1000)

        return () => {
            navigator.geolocation.clearWatch(watchId)
            window.clearInterval(intervalId)
        }
    }, [])

    const position = useMemo(() => [ currentPosition.lat, currentPosition.lng ], [ currentPosition ])

    return (
        <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={true}
            className='h-full w-full relative z-0'
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <RecenterMap position={position} />
            <Marker position={position} icon={markerIconConfig}>
                <Popup>Current location</Popup>
            </Marker>
            {routeGeometry && pickupCoords && destCoords && (
                <RouteLayer geometry={routeGeometry} pickup={pickupCoords} dest={destCoords} />
            )}
        </MapContainer>
    )
}

export default LiveTracking
