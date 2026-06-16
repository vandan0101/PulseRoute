import React from 'react'

const LocationSearchPanel = () => {
  return (
    <div>
      {/* this is just a sample data */}

      <div className='flex gap-4 items-center my-2 justify-start'>
         <h2 className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>

        <h4 className='font-medium'>
          24B, Near Kapoor's cafe, Sheryians Coding School
        </h4>
      </div>
    </div>
  )
}

export default LocationSearchPanel