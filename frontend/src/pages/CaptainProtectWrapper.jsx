import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'

const CaptainProtectWrapper = ({
    children
}) => {

    const { captain, setCaptain } = useContext(CaptainDataContext)
    const [ isLoading, setIsLoading ] = useState(true)

    const tempCaptain = {
        _id: 'temp-captain-1',
        fullname: {
            firstname: 'Temp',
            lastname: 'Captain'
        },
        email: 'captain@example.com',
        vehicle: {
            color: 'Black',
            plate: 'MH-01-TEMP',
            capacity: 4,
            vehicleType: 'car'
        }
    }




    useEffect(() => {
        const storedCaptain = localStorage.getItem('captain-profile')
        const captainData = storedCaptain ? JSON.parse(storedCaptain) : tempCaptain

        localStorage.setItem('token', localStorage.getItem('token') || 'captain-temp-token')
        localStorage.setItem('captain-profile', JSON.stringify(captainData))
        setCaptain(captainData)
        setIsLoading(false)
    }, [ setCaptain ])

    

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