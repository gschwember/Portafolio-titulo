import ProfileCard from '@shared/ui/ProfileCard'

const ResidentOverviewSection = ({ profiles }) => {
  return (
    <section className="mb-10 space-y-4 animate-fade-in-up">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">Mi Perfil</h1>
        <p className="mt-2 text-base text-stone-600">Resumen de cuenta y acciones rápidas de tu departamento.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            name={profile.name}
            role={profile.role}
            extraInfo={profile.extraInfo}
            status={profile.status}
            balance={profile.balance}
          />
        ))}
      </div>
    </section>
  )
}

export default ResidentOverviewSection
