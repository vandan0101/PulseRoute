import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainProtectWrapper = ({
    children
}) => {

    const token = localStorage.getItem('captain-token') || localStorage.getItem('token')
    const navigate = useNavigate()
    const { setCaptain } = useContext(CaptainDataContext)
    const [ isLoading, setIsLoading ] = useState(true)

    useEffect(() => {
        if (!token) {
            navigate('/captain-login')
            return
        }
        // Ensure axios will send the Authorization header and include credentials.
        axios.defaults.headers.common.Authorization = `Bearer ${token}`
        axios.get('/captains/profile', { withCredentials: true })
            .then((response) => {
                if (response.status === 200) {
                    setCaptain(response.data.captain)
                    setIsLoading(false)
                }
            })
            .catch((err) => {
                console.log(err)
                // If profile fetch fails, send user to login.
                localStorage.removeItem('token')
                localStorage.removeItem('captain-token')
                localStorage.removeItem('captain-profile')
                navigate('/captain-login')
            })
    }, [ navigate, setCaptain, token ])

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

export default CaptainProtectWrapper
