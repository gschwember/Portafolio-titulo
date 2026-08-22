const ActionCard = ({ title, description, icon, onClick, isPrimary = false }) => {
  return (
    <button
      onClick={onClick}
      className={`group interactive-lift flex w-full flex-col items-start rounded-2xl border p-6 text-left transition-all duration-300 ${
        isPrimary
          ? 'border-stone-900 bg-stone-900 shadow-md hover:shadow-xl'
          : 'border-stone-200 bg-stone-50 hover:border-amber-600 hover:shadow-md'
      }`}
    >
      <div
        className={`p-3 rounded-lg mb-4 transition-colors duration-300 ${
          isPrimary
            ? 'bg-stone-700 text-amber-300'
            : 'bg-stone-100 text-stone-700 group-hover:bg-amber-600 group-hover:text-amber-50'
        }`}
      >
        {icon}
      </div>

      <h3 className={`font-bold text-lg mb-1 transition-colors duration-300 ${isPrimary ? 'text-stone-50' : 'text-stone-900'}`}>
        {title}
      </h3>
      <p className={`m-0 text-sm leading-snug ${isPrimary ? 'text-stone-300' : 'text-stone-600'}`}>{description}</p>
    </button>
  )
}

export default ActionCard
