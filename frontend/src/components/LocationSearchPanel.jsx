import React from "react";

const LocationSearchPanel = (props) => {
  const locations = [
    "24B, Near Kapoor's cafe, Sheryians Coding School",
    "24B, Near Vandan's cafe, Sheryians Coding School",
    "24B, Near Krish's cafe, Sheryians Coding School",
    "24B, Near xyz's cafe, Sheryians Coding School",
  ];

  return (
    <div>
      {/* this is just a sample data */}
      {locations.map(function (elem,idx) {
        return <div key={idx} onClick={()=>{
          props.setPickup(elem)
          props.setDestination(elem)
          props.setVehiclePanel(true)
          props.setPanelOpen(false)
        }}
           className="flex gap-4 items-center my-2 justify-start">
            <h2 className="bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full">
              <i className="ri-map-pin-fill"></i>
            </h2>

            <h4 className="font-medium">
              {elem}
            </h4>
          </div>
        
      })}
    </div>
  );
};

export default LocationSearchPanel;
