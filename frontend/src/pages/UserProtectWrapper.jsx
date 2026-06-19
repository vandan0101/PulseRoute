import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from '../context/UserContext'

const UserProtectWrapper = ({
    children
}) => {
    const token = localStorage.getItem('token')
    const { user, setUser } = useContext(UserDataContext)
    const [ isLoading, setIsLoading ] = useState(true)

    const tempUser = {
        _id: 'temp-user-1',
        fullname: {
            firstname: 'Temp',
            lastname: 'User'
        },
        email: 'user@example.com'
    }

    useEffect(() => {
        const storedUser = localStorage.getItem('user-profile')
        const userData = storedUser ? JSON.parse(storedUser) : tempUser

        localStorage.setItem('token', token || 'user-temp-token')
        localStorage.setItem('user-profile', JSON.stringify(userData))
        setUser(userData)
        setIsLoading(false)
    }, [ token, setUser ])

    if (isLoading) {
        return (
            <div>Loading...</div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserProtectWrapper