import React, { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'

const CaptainRiding = () => {

    const [ finishRidePanel, setFinishRidePanel ] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const rideData = location.state?.ride



    useGSAP(function () {
        if (finishRidePanel) {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ finishRidePanel ])


    return (
        <div className='h-screen relative overflow-hidden'>

            <div className='absolute inset-0 z-0'>
                <LiveTracking ride={rideData} autoFollow={false} />
            </div>

            <div className='fixed z-20 p-6 top-0 flex items-center justify-between w-screen'>
                <img className='w-16' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
                <Link to='/captain-home' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>

            <div className='absolute left-0 right-0 bottom-0 z-20 bg-yellow-400 px-6 pb-8 pt-10'
                onClick={() => {
                    setFinishRidePanel(true)
                }}
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0 left-1/2 -translate-x-1/2' onClick={() => {

                }}><i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i></h5>
                <div className='flex items-center justify-between gap-4'>
                    <div>
                        <h4 className='text-2xl font-semibold'>Trip in Progress</h4>
                        <p className='mt-1 text-sm text-gray-800'>Heading to {rideData?.destination || 'destination'}</p>
                        <p className='mt-1 text-sm text-gray-700'>Passenger: {rideData?.user?.fullname?.firstname || 'Rider'}</p>
                    </div>
                    <button type='button' className='bg-green-600 text-white font-semibold p-3 px-8 rounded-lg'>Complete Ride</button>
                </div>
            </div>
            <div ref={finishRidePanelRef} className='fixed w-full z-50 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <FinishRide
                    ride={rideData}
                    setFinishRidePanel={setFinishRidePanel} />
            </div>

        </div>
    )
}

export default CaptainRiding
