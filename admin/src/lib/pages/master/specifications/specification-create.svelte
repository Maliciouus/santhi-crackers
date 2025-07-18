<script lang="ts">
    import { _axios } from '$lib/_axios';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { toast } from 'svelte-sonner';
    import { queryClient } from '$lib/query-client';
    import { createMutation } from '@tanstack/svelte-query';
    import Icon from '@iconify/svelte';
    import { defaults, superForm } from 'sveltekit-superforms';
    import { zod } from 'sveltekit-superforms/adapters';
    import { z } from 'zod';
    import type { SpecificationStoreProps } from './schema';

    // Define the schema for the specification form
    export const _specificationSchema = z.object({
        name: z.string({ message: 'Category is required' }),
        fields: z.array(z.string({ message: 'Field is required' }))
    });

    type CreateSpecificationData = z.infer<typeof _specificationSchema>;

    let { specificationStore }: SpecificationStoreProps = $props();
    let edit = $state(false);

    $effect(() => {
        edit = $specificationStore.mode === 'edit' && !!$specificationStore.id;
    });

    let newName = $state('');
    let categoryFields = $state<string[]>([]);
    let currentFieldName = $state('');

    const handleAddCategoryField = () => {
        if (currentFieldName.trim()) {
            categoryFields = [...categoryFields, currentFieldName];
            currentFieldName = '';
        }
    };

    const handleRemoveField = (index: number) => {
        categoryFields = categoryFields.filter((_, i) => i !== index);
    };

    const handleSave = createMutation({
        mutationFn: (data: CreateSpecificationData) => {
            return edit
                ? _axios.patch(`/specification/update/${$specificationStore.id}`, data)
                : _axios.post('/specification/addspec', data);
        },
        onSuccess: () => {
            toast.success(edit ? "Specification category updated successfully" : "Specification category created successfully");
            newName = '';
            categoryFields = [];
            queryClient.refetchQueries({ queryKey: ['specifications'] });
            specificationStore.update((store) => ({
                ...store,
                mode: 'list',
                id: '',
                name: '',
                fields: []
            }));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'An error occurred');
        }
    });

    const { form, errors, enhance, constraints, reset } = superForm(defaults(zod(_specificationSchema)), {
        SPA: true,
        validationMethod: 'oninput',
        validators: zod(_specificationSchema),
        clearOnSubmit: 'none',
        invalidateAll: false,
        resetForm: false,
        onSubmit: () => {
            const _data: CreateSpecificationData = {
                name: newName.trim(),
                fields: categoryFields
            };
            $handleSave.mutate(_data);
        }
    });

    $effect(() => {
        if (edit) {
            newName = $specificationStore.name || '';
            categoryFields = $specificationStore.fields || [];
        } else {
            reset();
        }
    });
</script>

<div class="max-w-[80%] text-maintext pl-[10%]">
    <form method="POST" use:enhance class="grid gap-4 py-4">
        <div>
            <Label for="categoryName">Name</Label>
            <Input
                id="categoryName"
                autocomplete="on"
                class="pr-10 mt-1"
                placeholder="Ex: Category Name"
                aria-invalid={$errors.name ? 'true' : undefined}
                bind:value={newName}
                {...$constraints.name}
            />

            {#if $errors.name}
                <span class="invalid text-xs text-red-500">{$errors.name}</span>
            {/if}
        </div>

        {#each categoryFields as field, index}
            <div class="flex items-center gap-2">
                <div class="flex-1">
                    <Label>Field {index + 1}</Label>
                    <Input
                        bind:value={categoryFields[index]}
                        class="pr-10 mt-1"
                        placeholder="Ex: Field Value"
                        aria-invalid={$errors.fields?.[index] ? 'true' : undefined}
                        {...$constraints.fields?.[index]}
                    />

                    {#if $errors.fields?.[index]}
                        <span class="invalid text-xs text-red-500">{$errors.fields[index]}</span>
                    {/if}
                </div>
                {#if edit}
                    <button
                        type="button"
                        onclick={() => handleRemoveField(index)}
                        class="mt-6 text-white hover:bg-red-700 bg-red-500 h-6 w-6 flex justify-center items-center rounded-full border border-white"
                    >
					<Icon icon="material-symbols:close-rounded" class="text-white" />
                    </button>
                {/if}
            </div>
        {/each}

        <div>
            <Label for="newField">New Field</Label>
            <div class="flex gap-2">
                <Input
                    id="newField"
                    bind:value={currentFieldName}
                    class="pr-10 mt-1"
                    placeholder="Ex: New Field"
                />
                <Button type="button" onclick={handleAddCategoryField} class="mt-1">
                    Add Field
                </Button>
            </div>
        </div>

        <div class="flex justify-start gap-2 mt-4">
            <Button type="submit" class="">
                {edit ? 'Update' : 'Save'}
                <Icon icon="zondicons:add-outline" class="text-white" />
            </Button>
        </div>
    </form>
</div>