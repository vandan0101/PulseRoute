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

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(defaultCenter)

    useEffect(() => {
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
        </MapContainer>
    )
}

export default LiveTracking
