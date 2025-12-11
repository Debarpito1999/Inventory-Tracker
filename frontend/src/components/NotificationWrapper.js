import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Notification from './Notification';

const NotificationWrapper = () => {
  const { user } = useContext(AuthContext);
  return user ? <Notification /> : null;
};

export default NotificationWrapper;








