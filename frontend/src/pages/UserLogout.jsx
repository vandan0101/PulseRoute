import React from 'react'
import { useNavigate } from 'react-router-dom'

export const UserLogout = () => {

    const navigate = useNavigate()

    localStorage.removeItem('token')
    localStorage.removeItem('user-profile')
    navigate('/login')

    return (
        <div>UserLogout</div>
    )
}

export default UserLogout