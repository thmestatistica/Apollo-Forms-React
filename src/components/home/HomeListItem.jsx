
function ItemList({ text }) {
  return (
    <li className="text-center transition-all duration-500 hover:translate-y-1 bg-apollo-100 rounded-lg shadow-xl flex flex-row items-center justify-evenly gap-4 p-5">
      {text}
    </li>
  )
}

export default ItemList