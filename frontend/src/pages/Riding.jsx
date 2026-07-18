import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import LiveTracking from '../components/LiveTracking'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {}
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()
    const [ currentRide, setCurrentRide ] = useState(ride || null)
    const [ isPaying, setIsPaying ] = useState(false)

    useEffect(() => {
        const handleRideEnded = (endedRide) => {
            setCurrentRide(endedRide)
        }

        const handleCaptainLocationUpdated = ({ rideId, location: captainLocation }) => {
            setCurrentRide((previousRide) => {
                if (!previousRide || previousRide._id !== rideId) {
                    return previousRide
                }

                return {
                    ...previousRide,
                    captain: {
                        ...previousRide.captain,
                        location: captainLocation
                    }
                }
            })
        }

        socket.on('ride-ended', handleRideEnded)
        socket.on('captain-location-updated', handleCaptainLocationUpdated)

        return () => {
            socket.off('ride-ended', handleRideEnded)
            socket.off('captain-location-updated', handleCaptainLocationUpdated)
        }
    }, [ socket ])

    const handlePayment = async () => {
        if (!currentRide?._id || isPaying || currentRide?.paymentStatus === 'paid') {
            return
        }

        setIsPaying(true)

        try {
            const response = await axios.post('/rides/pay', {
                rideId: currentRide._id
            })

            setCurrentRide(response.data)
            navigate('/home')
        } catch (error) {
            alert(error.response?.data?.message || 'Unable to complete payment.')
        } finally {
            setIsPaying(false)
        }
    }

    const isCompletedRide = currentRide?.status === 'completed'
    const paymentCompleted = currentRide?.paymentStatus === 'paid'

    return (
        <div className='h-screen'>
            <Link to='/home' className='fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                <i className="text-lg font-medium ri-home-5-line"></i>
            </Link>
            <div className='h-1/2'>
                <LiveTracking
                    ride={currentRide}
                    autoFollow={true}
                />
            </div>
            <div className='h-1/2 p-4'>
                <div className='flex items-center justify-between'>
                    <img className='h-12' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="" />
                    <div className='text-right'>
                        <h2 className='text-lg font-medium capitalize'>{currentRide?.captain?.fullname?.firstname || 'Driver'}</h2>
                        <h4 className='text-xl font-semibold -mt-1 -mb-1'>{currentRide?.captain?.vehicle?.plate || 'Vehicle assigned'}</h4>
                        <p className='text-sm text-gray-600 capitalize'>{currentRide?.captain?.vehicle?.color || 'Vehicle'} {currentRide?.captain?.vehicle?.vehicleType || ''}</p>
                    </div>
                </div>

                <div className='mt-4 rounded-xl bg-amber-100 border border-amber-300 p-4'>
                    <p className='text-sm font-medium text-amber-900'>Ride OTP</p>
                    <p className='mt-1 text-3xl font-bold tracking-[0.35em] text-amber-950'>{currentRide?.otp || '------'}</p>
                    <p className='mt-1 text-xs text-amber-800'>Share this OTP with the driver when the ride starts.</p>
                </div>

                <div className='flex gap-2 justify-between flex-col items-center'>
                    <div className='w-full mt-5'>
                        <div className='flex items-center gap-5 p-3 border-b-2'>
                            <i className="text-lg ri-map-pin-2-fill"></i>
                            <div>
                                <h3 className='text-lg font-medium'>Pickup</h3>
                                <p className='text-sm -mt-1 text-gray-600'>{currentRide?.pickup}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3 border-b-2'>
                            <i className="text-lg ri-map-pin-2-fill"></i>
                            <div>
                                <h3 className='text-lg font-medium'>Destination</h3>
                                <p className='text-sm -mt-1 text-gray-600'>{currentRide?.destination}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3'>
                            <i className="ri-currency-line"></i>
                            <div>
                                <h3 className='text-lg font-medium'>Rs. {currentRide?.fare}</h3>
                                <p className='text-sm -mt-1 text-gray-600'>
                                    {paymentCompleted ? 'Cash paid' : isCompletedRide ? 'Cash payment pending' : 'Cash payment due after trip ends'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handlePayment}
                    disabled={!isCompletedRide || paymentCompleted || isPaying}
                    className='w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg disabled:cursor-not-allowed disabled:bg-green-300'
                >
                    {paymentCompleted ? 'Payment Completed' : isPaying ? 'Processing Payment...' : isCompletedRide ? 'Make a Payment' : 'Complete Ride First'}
                </button>
            </div>
        </div>
    )
}

export default Riding
