import React from 'react';

import codeslingLogo from './codesling-logo.svg';

const Logo = ({
  className
}) => {
  return (
    <img 
      alt="Codesling.io Logo"
      className={`logo ${className ? className : ''}`}
      src='http://www.doggiesparadise.com/images/Doggies/doggie111.jpg'
    />
  );
};

export default Logo;
