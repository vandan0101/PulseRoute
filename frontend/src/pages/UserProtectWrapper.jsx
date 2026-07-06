import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import { Navigate } from "react-router-dom";
import axios from "axios";

const UserProtectWrapper = ({ children }) => {
  const token = localStorage.getItem("user-token") || localStorage.getItem("token");
  const cachedUser = useMemo(() => {
    const storedUser = localStorage.getItem("user-profile");
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);
  const { setUser } = useContext(UserDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setShouldRedirect(true);
      return;
    }

    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
    }

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setUser(response.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
        localStorage.removeItem("token");
        localStorage.removeItem("user-token");
        localStorage.removeItem("user-profile");
        setIsLoading(false);
        setShouldRedirect(true);
      });
  }, [cachedUser, setUser, token]);

  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default UserProtectWrapper;
