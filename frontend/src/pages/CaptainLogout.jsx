
import React from 'react'
import { useNavigate } from 'react-router-dom'

export const CaptainLogout = () => {
    const navigate = useNavigate()

    localStorage.removeItem('token')
    localStorage.removeItem('captain-profile')
    navigate('/captain-login')

    return (
        <div>CaptainLogout</div>
    )
}

export default CaptainLogout