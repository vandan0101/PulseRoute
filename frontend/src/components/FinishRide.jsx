import React from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const getCaptainToken = () => localStorage.getItem('captain-token') || localStorage.getItem('token')

const FinishRide = (props) => {
    const navigate = useNavigate()
    const [otp, setOtp] = React.useState('')

    async function endRide() {
        if (!otp || otp.trim().length !== 6) {
            alert('Please enter a valid 6-digit OTP.');
            return;
        }

        try {
            const response = await axios.post('/rides/end-ride', {
                rideId: props.ride._id,
                otp: otp.trim(),
            }, { withCredentials: true })

            if (response.status === 200) {
                navigate('/captain-home')
            }
        } catch (err) {
            console.error('Failed to end ride:', err)
            if (err.response?.status === 401) {
                window.location.href = '/captain-login'
                return
            }
            alert(err.response?.data?.message || 'Unable to complete ride.')
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setFinishRidePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Finish this Ride</h3>
            <div className='flex items-center justify-between p-4 border-2 border-yellow-400 rounded-lg mt-4'>
                <div className='flex items-center gap-3 '>
                    <img className='h-12 rounded-full object-cover w-12' src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="" />
                    <h2 className='text-lg font-medium'>{props.ride?.user?.fullname?.firstname}</h2>
                </div>
                <h5 className='text-lg font-semibold'>2.2 KM</h5>
            </div>
            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Pickup</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Destination</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Rs. {props.ride?.fare}</h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash</p>
                        </div>
                    </div>
                </div>

                <div className='mt-10 w-full'>
                    <input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" className='bg-[#eee] px-6 py-4 font-mono text-lg rounded-lg w-full mt-3' placeholder='Enter OTP to complete ride' />
                    <button
                        onClick={endRide}
                        className='w-full mt-5 flex  text-lg justify-center bg-green-600 text-white font-semibold p-3 rounded-lg'>Finish Ride</button>
                </div>
            </div>
        </div>
    )
}

export default FinishRide
