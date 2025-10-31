import React from 'react'
import { Link } from 'react-router-dom'

function LinkLogin({ to, text }) {

  return (
    <Link to={to} className='inline-block cursor-pointer items-center justify-center rounded-xl border-2 border-apollo-500 bg-apollo-500 px-10 py-3 font-extrabold text-apollo-100 shadow-md transition-all duration-300 hover:transform-[translateY(-.335rem)] hover:shadow-xl text-center text-xl'>
      {text}
    </Link>
  )
}

export default LinkLogin