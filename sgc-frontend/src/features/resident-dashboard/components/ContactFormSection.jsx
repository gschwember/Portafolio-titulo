import { useState } from 'react'
import FormInput from '@shared/ui/FormInput'
import { defaultContactForm } from '../../contact/model/contact.model'

const ContactFormSection = () => {
  const [email, setEmail] = useState(defaultContactForm.email)
  const [phone, setPhone] = useState(defaultContactForm.phone)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setFeedback('Tus datos de contacto fueron actualizados correctamente.')
  }

  return (
    <section className="surface-panel-soft p-6 md:p-8 animate-fade-in-up">
      <h2 className="mb-6 border-b border-stone-200 pb-4 text-xl font-bold uppercase tracking-wide text-stone-900">
        Datos de contacto
      </h2>

      <form onSubmit={handleSubmit}>
        <FormInput
          label="Correo electrónico"
          type="email"
          placeholder="juan@correo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <FormInput
          label="Telefono movil"
          type="tel"
          placeholder="+56 9 1234 5678"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            className="btn-primary bg-amber-700 text-amber-50 hover:bg-amber-800"
          >
            Guardar cambios
          </button>
        </div>
      </form>

      {feedback && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {feedback}
        </p>
      )}
    </section>
  )
}

export default ContactFormSection
