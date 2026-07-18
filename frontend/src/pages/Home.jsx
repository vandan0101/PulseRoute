import React, { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css'
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';

const getUserToken = () => localStorage.getItem('user-token') || localStorage.getItem('token')
const MIN_QUERY_LENGTH = 3

const Home = () => {
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)
    const [ isLoadingSuggestions, setIsLoadingSuggestions ] = useState(false)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [ tripSheetHidden, setTripSheetHidden ] = useState(false)
    const [ isCreatingRide, setIsCreatingRide ] = useState(false)
    const pickupSuggestionRequestId = useRef(0)
    const destinationSuggestionRequestId = useRef(0)

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        if (!socket || !user?._id) {
            return;
        }

        const joinUser = () => {
            socket.emit('join', { userType: 'user', userId: user._id });
        };

        joinUser();
        socket.on('connect', joinUser);

        return () => {
            socket.off('connect', joinUser);
        };
    }, [ socket, user ]);

    useEffect(() => {
        const handleRideConfirmed = (ride) => {
            hideAllTripPanels()
            setWaitingForDriver(true)
            setRide(ride)
        }

        const handleRideStarted = (ride) => {
            hideAllTripPanels()
            navigate('/riding', { state: { ride } })
        }

        socket.on('ride-confirmed', handleRideConfirmed)
        socket.on('ride-started', handleRideStarted)

        return () => {
            socket.off('ride-confirmed', handleRideConfirmed)
            socket.off('ride-started', handleRideStarted)
        }
    }, [ navigate, socket ])

    useEffect(() => {
        setTripSheetHidden(vehiclePanel || confirmRidePanel || vehicleFound || waitingForDriver)
    }, [ vehiclePanel, confirmRidePanel, vehicleFound, waitingForDriver ])

    const hideAllTripPanels = () => {
        setVehiclePanel(false)
        setConfirmRidePanel(false)
        setVehicleFound(false)
        setWaitingForDriver(false)
    }


    const handlePickupChange = async (e) => {
        const value = e.target.value
        setPickup(value)
        setActiveField('pickup')
        setPanelOpen(true)

        if (value.trim().length < MIN_QUERY_LENGTH) {
            setPickupSuggestions([])
            setIsLoadingSuggestions(false)
            return
        }

        const requestId = ++pickupSuggestionRequestId.current
        setIsLoadingSuggestions(true)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: value },
                headers: {
                    Authorization: `Bearer ${getUserToken()}`
                }

            })
            if (requestId === pickupSuggestionRequestId.current) {
                setPickupSuggestions(Array.isArray(response.data) ? response.data : [])
                setDestinationSuggestions([])
            }
        } catch (error) {
            if (requestId === pickupSuggestionRequestId.current) {
                setPickupSuggestions([])
            }
        } finally {
            if (requestId === pickupSuggestionRequestId.current) {
                setIsLoadingSuggestions(false)
            }
        }
    }

    const handleDestinationChange = async (e) => {
        const value = e.target.value
        setDestination(value)
        setActiveField('destination')
        setPanelOpen(true)

        if (value.trim().length < MIN_QUERY_LENGTH) {
            setDestinationSuggestions([])
            setIsLoadingSuggestions(false)
            return
        }

        const requestId = ++destinationSuggestionRequestId.current
        setIsLoadingSuggestions(true)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: value },
                headers: {
                    Authorization: `Bearer ${getUserToken()}`
                }
            })
            if (requestId === destinationSuggestionRequestId.current) {
                setDestinationSuggestions(Array.isArray(response.data) ? response.data : [])
                setPickupSuggestions([])
            }
        } catch (error) {
            if (requestId === destinationSuggestionRequestId.current) {
                setDestinationSuggestions([])
            }
        } finally {
            if (requestId === destinationSuggestionRequestId.current) {
                setIsLoadingSuggestions(false)
            }
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
                // opacity:1
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
                // opacity:0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [ panelOpen ])


    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehiclePanel ])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePanel ])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehicleFound ])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ waitingForDriver ])


    async function findTrip() {
        if (pickup.trim().length < MIN_QUERY_LENGTH || destination.trim().length < MIN_QUERY_LENGTH) {
            return
        }

        setPanelOpen(false)

        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
                params: { pickup, destination },
                headers: {
                    Authorization: `Bearer ${getUserToken()}`
                }
            })

            setFare(response.data)
            hideAllTripPanels()
            setVehiclePanel(true)
        } catch (error) {
            setVehiclePanel(false)
            alert(error.response?.data?.message || 'Unable to find this trip right now. Please select the location from the search list and try again.')
        }


    }

    async function createRide() {
        if (isCreatingRide) {
            return null
        }

        setIsCreatingRide(true)

        try {
            const token = getUserToken()
            console.log('createRide: using token length', token ? token.length : 0)
            if (!token) {
                // No token — redirect user to login to obtain a token before creating rides.
                console.warn('createRide: missing token, redirecting to login')
                navigate('/login')
                return null
            }
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
                pickup,
                destination,
                vehicleType
            }, {
                headers: {
                    Authorization: `Bearer ${getUserToken()}`
                }
            })

            return response.data
        } catch (error) {
            return null
        } finally {
            setIsCreatingRide(false)
        }
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            <img className='w-16 absolute left-5 top-5 z-1000' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
            <div className='h-screen w-screen'>
                {/* image for temporary use  */}
                <LiveTracking />
            </div>
            <div className='z-1000 flex flex-col justify-end h-screen absolute top-0 w-full'>
                <div className={`h-[30%] p-6 bg-white relative transition-transform duration-300 ease-in-out ${tripSheetHidden ? 'translate-y-full pointer-events-none' : 'translate-y-0 pointer-events-auto'}`}>
                    <h5 ref={panelCloseRef} onClick={() => {
                        setPanelOpen(false)
                    }} className='absolute opacity-0 right-6 top-6 text-2xl'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className='text-2xl font-semibold'>Find a trip</h4>
                    <form className='relative py-3' onSubmit={(e) => {
                        submitHandler(e)
                    }}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('pickup')
                            }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
                            type="text"
                            placeholder='Add a pick-up location'
                        />
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('destination')
                            }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full  mt-3'
                            type="text"
                            placeholder='Enter your destination' />
                    </form>
                    <button
                        onClick={findTrip}
                        className='bg-black text-white px-4 py-2 rounded-lg mt-3 w-full'>
                        Find Trip
                    </button>
                </div>
                <div ref={panelRef} className='bg-white h-0 overflow-hidden'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        isLoading={isLoadingSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                    />
                </div>
            </div>
            {vehiclePanel && (
                <div ref={vehiclePanelRef} className='fixed w-full z-1100 bottom-0 bg-white px-3 py-10 pt-12'>
                    <VehiclePanel
                        selectVehicle={setVehicleType}
                        fare={fare}
                        setConfirmRidePanel={setConfirmRidePanel}
                        setVehiclePanel={setVehiclePanel} />
                </div>
            )}
            {confirmRidePanel && (
                <div ref={confirmRidePanelRef} className='fixed w-full z-1200 bottom-0 bg-white px-3 py-6 pt-12'>
                    <ConfirmRide
                        createRide={createRide}
                        pickup={pickup}
                        destination={destination}
                        fare={fare}
                        vehicleType={vehicleType}
                        isCreatingRide={isCreatingRide}
                        setConfirmRidePanel={setConfirmRidePanel}
                        setVehicleFound={setVehicleFound} />
                </div>
            )}
            {vehicleFound && (
                <div ref={vehicleFoundRef} className='fixed w-full z-1300 bottom-0 bg-white px-3 py-6 pt-12'>
                    <LookingForDriver
                        pickup={pickup}
                        destination={destination}
                        fare={fare}
                        vehicleType={vehicleType}
                        setVehicleFound={setVehicleFound} />
                </div>
            )}
            {waitingForDriver && (
                <div ref={waitingForDriverRef} className='fixed w-full z-1400 bottom-0 bg-white px-3 py-6 pt-12'>
                    <WaitingForDriver
                        ride={ride}
                        setVehicleFound={setVehicleFound}
                        setWaitingForDriver={setWaitingForDriver}
                        waitingForDriver={waitingForDriver} />
                </div>
            )}
        </div>
    )
}

export default Home
