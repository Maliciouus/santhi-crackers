<script lang="ts">
	import { goto } from '$app/navigation';
	import { _axios } from '$lib/_axios';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { writableGlobalStore } from '$lib/stores/global-store';
	import Icon from '@iconify/svelte';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { z } from 'zod';
	import bg from '$lib/assets/log-bg.jpg'; // Import the image

	// Schema for form validation
	const schema = z.object({
		email: z.string().email(),
		password: z.string().min(4)
	});

	type LoginData = z.infer<typeof schema>;

	// Form state
	let email = $state('');
	let password = $state('');
	let passwordShown = $state(false);

	// Login mutation with loading state
	let loginMutation = createMutation({
		mutationFn: (data: LoginData) => _axios.post('/auth/login', data),
		onSuccess({ data }) {
			if (!data.ok) {
				toast(data.message, {});
				return;
			}
			localStorage.setItem('storeId', data.data.id);
			toast(data.message, {});
			goto('/dashboard');
		},
		onError(error, variables, context) {
			console.error('onError', error, variables, context);
			toast('An error occurred during login. Please try again.');
		}
	});

	// Derived loading state
	const isLoading = $derived($loginMutation.isPending);

	function login(e: Event) {
		e.preventDefault();
		try {
			const data = schema.parse({
				email,
				password
			});
			$loginMutation.mutate(data);
		} catch (error) {
			console.error(error);
			toast('Invalid email or password');
		}
	}
</script>

<div class='backdrop-blur-md ' style="background-image: url('/bgp.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat; min-height: 100dvh;">
	<div class="backdrop-blur-sm flex min-h-screen">
		<!-- Image Container -->
		<div class="hidden md:flex w-1/2 justify-center items-center">
			<div class="flex justify-center items-center  rounded-xl">
				<img src="/dummyLogo.png" alt="Logo" class="h-auto w-1/2" />
			</div>
		</div>
	
		<!-- Login Form Container -->
		<div class="flex w-full md:w-1/2 items-center justify-center">
			<Card.Root class="w-full max-w-md bg-white/20 backdrop-blur-md shadow-lg rounded-lg p-8 border border-white/50">
				<Card.Header class="text-center mb-6">
					<Card.Title class="text-2xl font-semibold text-white">Login</Card.Title>
					<p class="text-sm text-white">Welcome back! Please enter your credentials.</p>
				</Card.Header>
				<Card.Content>
					<form onsubmit={login}>
						<div class="space-y-6">
							<div class="space-y-2">
								<Label for="email" class="text-sm font-medium text-white">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="admin@example.com"
									required
									bind:value={email}
									class="w-full px-3 py-2 border border-purple-300 text-white placeholder:text-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/30"
								/>
							</div>
							<div class="space-y-2 relative">
								<Label for="password" class="text-sm  font-medium text-white">Password</Label>
								<Input
									id="password"
									placeholder="Password"
									type={passwordShown ? 'text' : 'password'}
									required
									bind:value={password}
									class="w-full px-3 py-2 border border-purple-300  text-white placeholder:text-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 bg-white/30"
								/>
								<Icon
									onclick={() => {
										passwordShown = !passwordShown;
									}}
									icon={!passwordShown ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
									class="absolute right-3 bottom-3 cursor-pointer text-primary hover:scale-110 transition-all duration-100 text-xl"
								/>
							</div>
							<Button
								type="submit"
								disabled={isLoading}
								class="w-full bg-white hover:text-white hover:scale-105 border font-bold transition-all duration-200 text-purple-900 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center"
							>
								{#if isLoading}
									<Icon icon="mdi:loading" class="animate-spin mr-2" />
									Logging in...
								{:else}
									Login
								{/if}
							</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>