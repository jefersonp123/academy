import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  Skeleton,
  EmptyState,
} from '@/components/ui'
import { ROUTES } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/utils'

// ─── Schema ──────────────────────────────────────────────────────────────────

const editAthleteSchema = z.object({
  first_name: z.string().min(2, 'Mínimo 2 caracteres'),
  last_name: z.string().min(2, 'Mínimo 2 caracteres'),
  birth_date: z.string().min(1, 'Requerido'),
  gender: z.string().optional(),
  document_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
  category_id: z.string().min(1, 'Selecciona una categoría'),
})

type EditAthleteFormValues = z.infer<typeof editAthleteSchema>

// ─── Options ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export function AthleteEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const academyId = useAuthStore((s) => s.activeAcademy?.id) ?? ''

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['athlete.detail', academyId, id],
    queryFn: () => athletesApi.getById(academyId, id!),
    enabled: !!academyId && !!id,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories.list', academyId],
    queryFn: () => categoriesApi.list(academyId),
    enabled: !!academyId,
  })

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const athlete = enrollment?.athletes
  const initialCategoryId = useRef<string>('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditAthleteFormValues>({
    resolver: zodResolver(editAthleteSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      birth_date: '',
      gender: '',
      document_number: '',
      phone: '',
      email: '',
      notes: '',
      category_id: '',
    },
  })

  // Populate form when data loads
  useEffect(() => {
    if (athlete && enrollment && categories.length > 0) {
      const catId = enrollment.categories?.id ?? ''
      initialCategoryId.current = catId

      reset({
        first_name: athlete.first_name ?? '',
        last_name: athlete.last_name ?? '',
        birth_date: athlete.birth_date ?? '',
        gender: athlete.gender ?? '',
        document_number: athlete.document_number ?? '',
        phone: athlete.phone ?? '',
        email: athlete.email ?? '',
        notes: athlete.notes ?? '',
        category_id: catId,
      })
    }
  }, [athlete, enrollment, categories, reset])

  const mutation = useMutation({
    mutationFn: async (data: EditAthleteFormValues) => {
      const { category_id, ...athleteFields } = data

      // 1. Update athlete personal data
      const payload: Record<string, unknown> = {}
      if (athleteFields.first_name) payload.first_name = athleteFields.first_name
      if (athleteFields.last_name) payload.last_name = athleteFields.last_name
      if (athleteFields.birth_date) payload.birth_date = athleteFields.birth_date
      if (athleteFields.gender) payload.gender = athleteFields.gender
      if (athleteFields.document_number !== undefined) payload.document_number = athleteFields.document_number || null
      if (athleteFields.phone !== undefined) payload.phone = athleteFields.phone || null
      if (athleteFields.email !== undefined) payload.email = athleteFields.email || null
      if (athleteFields.notes !== undefined) payload.notes = athleteFields.notes || null

      const promises: Promise<unknown>[] = [
        athletesApi.update(academyId, id!, payload),
      ]

      // 2. Update category only if it changed
      if (category_id && category_id !== initialCategoryId.current) {
        promises.push(athletesApi.updateCategory(academyId, id!, category_id))
      }

      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete.detail', academyId, id] })
      queryClient.invalidateQueries({ queryKey: ['athletes.list', academyId] })
      toast.success('Atleta actualizado exitosamente')
      navigate(ROUTES.ATHLETE_DETAIL(id!))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Error al actualizar atleta')),
  })

  const onSubmit = (data: EditAthleteFormValues) => mutation.mutate(data)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
      </div>
    )
  }

  if (!enrollment || !athlete) {
    return (
      <EmptyState
        title="Atleta no encontrado"
        description="El atleta solicitado no existe o fue eliminado"
        action={{ label: 'Volver a atletas', onClick: () => navigate(ROUTES.ATHLETES) }}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Editar Atleta"
        breadcrumbs={[
          { label: 'Atletas', href: ROUTES.ATHLETES },
          { label: `${athlete.first_name} ${athlete.last_name}`, href: ROUTES.ATHLETE_DETAIL(id!) },
          { label: 'Editar' },
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
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    label="Género"
                    options={GENDER_OPTIONS}
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    error={errors.gender?.message}
                  />
                )}
              />
              <Input
                label="Documento de identidad"
                placeholder="Ej: V-12345678"
                error={errors.document_number?.message}
                fullWidth
                {...register('document_number')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="correo@ejemplo.com"
                error={errors.email?.message}
                fullWidth
                {...register('email')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Contact & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto y Notas</CardTitle>
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
                label="Notas"
                placeholder="Observaciones o notas adicionales (opcional)"
                rows={4}
                error={errors.notes?.message}
                fullWidth
                {...register('notes')}
              />
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
                  error={errors.category_id?.message}
                />
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(ROUTES.ATHLETE_DETAIL(id!))}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
              Guardar Cambios
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
