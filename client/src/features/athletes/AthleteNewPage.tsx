import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { athletesApi } from '@/lib/api/athletes'
import { categoriesApi } from '@/lib/api/categories'
import { useAuthStore } from '@/store/authStore'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Textarea,
} from '@/components/ui'
import { ROUTES } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/utils'

// ─── Schema ──────────────────────────────────────────────────────────────────

const athleteSchema = z.object({
  first_name: z.string().min(2, 'Mínimo 2 caracteres'),
  last_name: z.string().min(2, 'Mínimo 2 caracteres'),
  birth_date: z.string().min(1, 'Requerido'),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  blood_type: z.string().optional(),
  phone: z.string().optional(),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  category_id: z.string().min(1, 'Selecciona una categoría'),
})

type AthleteFormValues = z.infer<typeof athleteSchema>

// ─── Options ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
]

const BLOOD_TYPE_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export function AthleteNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const { data: categories = [] } = useQuery({
    queryKey: ['categories.list', academyId],
    queryFn: () => categoriesApi.list(academyId),
    enabled: !!academyId,
  })

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: AthleteFormValues) => {
      const payload: Record<string, unknown> = {
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        category_id: data.category_id,
      }
      if (data.gender) payload.gender = data.gender
      if (data.nationality) payload.nationality = data.nationality
      if (data.blood_type) payload.blood_type = data.blood_type
      if (data.phone) payload.phone = data.phone
      if (data.allergies) payload.allergies = data.allergies
      if (data.medical_conditions) payload.medical_conditions = data.medical_conditions
      if (data.emergency_contact_name) payload.emergency_contact_name = data.emergency_contact_name
      if (data.emergency_contact_phone) payload.emergency_contact_phone = data.emergency_contact_phone
      return athletesApi.create(academyId, payload)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['athletes.list', academyId] })
      toast.success('Atleta registrado exitosamente')
      const enrollmentId = res.enrollment?.id
      if (enrollmentId) {
        navigate(ROUTES.ATHLETE_DETAIL(enrollmentId))
      } else {
        navigate(ROUTES.ATHLETES)
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al registrar atleta')),
  })

  const onSubmit = (data: AthleteFormValues) => mutation.mutate(data)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Registrar Atleta"
        breadcrumbs={[
          { label: 'Atletas', href: ROUTES.ATHLETES },
          { label: 'Nuevo' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1 — Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                placeholder="Ej: Juan"
                error={errors.first_name?.message}
                fullWidth
                {...register('first_name')}
              />
              <Input
                label="Apellido *"
                placeholder="Ej: Pérez"
                error={errors.last_name?.message}
                fullWidth
                {...register('last_name')}
              />
              <Input
                label="Fecha de nacimiento *"
                type="date"
                error={errors.birth_date?.message}
                fullWidth
                {...register('birth_date')}
              />
              <Input
                label="Nacionalidad"
                placeholder="Ej: Venezolano"
                error={errors.nationality?.message}
                fullWidth
                {...register('nationality')}
              />
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    label="Género"
                    options={GENDER_OPTIONS}
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar género"
                    error={errors.gender?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="blood_type"
                render={({ field }) => (
                  <Select
                    label="Tipo de sangre"
                    options={BLOOD_TYPE_OPTIONS}
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar tipo"
                    error={errors.blood_type?.message}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Contact & Medical */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto y Médico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Teléfono"
                placeholder="+58 412 000 0000"
                error={errors.phone?.message}
                fullWidth
                {...register('phone')}
              />
              <Textarea
                label="Alergias"
                placeholder="Describe las alergias conocidas (opcional)"
                rows={3}
                error={errors.allergies?.message}
                fullWidth
                {...register('allergies')}
              />
              <Textarea
                label="Condiciones médicas"
                placeholder="Describe condiciones médicas relevantes (opcional)"
                rows={3}
                error={errors.medical_conditions?.message}
                fullWidth
                {...register('medical_conditions')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contacto de emergencia"
                  placeholder="Nombre"
                  error={errors.emergency_contact_name?.message}
                  fullWidth
                  {...register('emergency_contact_name')}
                />
                <Input
                  label="Teléfono de emergencia"
                  placeholder="+58 412 000 0000"
                  error={errors.emergency_contact_phone?.message}
                  fullWidth
                  {...register('emergency_contact_phone')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 — Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Asignación</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="category_id"
              render={({ field }) => (
                <Select
                  label="Categoría *"
                  options={categoryOptions}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  placeholder="Seleccionar categoría"
                  error={errors.category_id?.message}
                />
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(ROUTES.ATHLETES)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Registrar Atleta
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
