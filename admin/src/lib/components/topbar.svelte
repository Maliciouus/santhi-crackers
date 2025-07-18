<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { imgUrl } from '$lib/config';
	import { writableGlobalStore } from '$lib/stores/global-store';
	import { createMutation } from '@tanstack/svelte-query';
	import * as Avatar from './ui/avatar';

	function formatDate(dateString: string | number | Date) {
		const date = new Date(dateString);
		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		const hours = date.getHours() % 12 || 12;
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const ampm = date.getHours() >= 12 ? 'pm' : 'am';
		return `${day}/${month}/${year}, ${hours}:${minutes}${ampm}`;
	}

	// Logout mutation
	const logoutMutation = createMutation({
		mutationFn: () => _axios.post('/auth/logout'),
		onSuccess() {
			localStorage.removeItem('restaurent');
			localStorage.removeItem('isManager');
			goto('/');
		}
	});

	function logout() {
		$logoutMutation.mutate();
	}
</script>

<div
	class="bg-zinc-100 flex items-center justify-start min-h-[65px] shadow-md"
>
	<div class="ml-auto flex text-white gap-2 items-center">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Avatar.Root class="mx-4 cursor-pointer">
					<!-- <Avatar.Image
						src={imgUrl + $writableGlobalStore.adminDetails.restaurentImage}
						alt="Profile"
						class="object-cover"
					></Avatar.Image> -->
					
					<Avatar.Fallback class="text-white bg-custom-gradient">A</Avatar.Fallback>
				</Avatar.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>Account</DropdownMenu.GroupHeading>
					<DropdownMenu.Separator></DropdownMenu.Separator>
					<DropdownMenu.Item
						onclick={() => {
							goto('/dashboard/settings');
						}}>Settings</DropdownMenu.Item
					>
					<DropdownMenu.Item onclick={() => logout()}>Logout</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
