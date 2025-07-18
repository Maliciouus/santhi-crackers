<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { writableGlobalStore } from '$lib/stores/global-store';
	import Icon from '@iconify/svelte';
import logo from "$lib/assets/logo.png"
	const routes = $state([
		{
			type: 'heading',
			name: 'Analytics'
		},
		{
			name: 'Order Statistics',
			href: '/dashboard/',
			icon: 'uil:analysis',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			type: 'heading',
			name: 'Dashboard'
		},
		{
			name: 'Master',
			href: '/dashboard/master/',
			icon: 'material-symbols-light:dashboard',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Users',
			href: '/dashboard/users/',
			icon: 'meteor-icons:user',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Orders',
			href: '/dashboard/orders/',
			icon: 'solar:cart-check-broken',
			subRoutes: '-',
			canManagerAccess: true
		},
		// {
		// 	name: 'Employee Orders',
		// 	href: '/dashboard/empOrders/',
		// 	icon: 'solar:cart-check-broken',
		// 	subRoutes: '-',
		// 	canManagerAccess: true
		// },
		{
			name: "Today's Order",
			href: "/dashboard/todayorder/",
			icon: 'hugeicons:shopping-cart-check-in-02',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Notification',
			href: '/dashboard/notification/',
			icon: 'typcn:bell',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			type: 'heading',
			name: 'Products'
		},
		{
			name: 'Brands',
			href: '/dashboard/brands/',
			icon: 'solar:shield-star-linear',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Categories',
			href: '/dashboard/categories/',
			icon: 'iconamoon:category',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Group',
			href: '/dashboard/group/',
			icon: 'mingcute:ai-line',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Products',
			href: '/dashboard/products/',
			icon: 'mingcute:classify-add-2-fill',
			subRoutes: '-',
			canManagerAccess: true
		},
		// {
		// 	name: 'Demands',
		// 	href: '/dashboard/demand/',
		// 	icon: 'tabler:target-arrow',
		// 	subRoutes: '-',
		// 	canManagerAccess: true
		// },
		// {
		// 	type: 'heading',
		// 	name: 'Offers'
		// },
		// {
		// 	name: 'Combo Offers',
		// 	href: '/dashboard/comboOffer/',
		// 	icon: 'icon-park-outline:adjacent-item',
		// 	subRoutes: '-',
		// 	canManagerAccess: true
		// },
		// {
		// 	name: 'Offers',
		// 	href: '/dashboard/offer/',
		// 	icon: 'tabler:rosette-discount-filled',
		// 	subRoutes: '-',
		// 	canManagerAccess: true
		// },
		// {
		// 	type: 'heading',
		// 	name: 'Management'
		// },
		// {
		// 	name: 'Managers',
		// 	href: '/hidden-admin-base-007/dashboard/managers/',
		// 	icon: 'grommet-icons:user-manager',
		// 	subRoutes: '-',
		// 	canManagerAccess: false
		// },
		// {
		// 	name: 'Employees',
		// 	href: '/dashboard/employees/',
		// 	icon: 'grommet-icons:user-manager',
		// 	subRoutes: '-',
		// 	canManagerAccess: false
		// },
		// {
		// 	name: 'Delivery Agent',
		// 	href: '/dashboard/deliveryagent/',
		// 	icon: 'iconamoon:delivery-light',
		// 	subRoutes: '-',
		// 	canManagerAccess: true
		// },
		// {
		// 	name: 'Restaurants',
		// 	href: '/hidden-admin-base-007/dashboard/restaurents',
		// 	icon: 'heroicons:building-office-2',
		// 	subRoutes: '-'
		// },
		{
			type: 'heading',
			name: 'Utils'
		},
		{
			name: 'Coupons',
			href: '/dashboard/coupons/',
			icon: 'bxs:offer',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Privacy Policy',
			href: '/dashboard/privacy-policy/',
			icon: 'ic:sharp-privacy-tip',
			subRoutes: '-',
			canManagerAccess: true
		},
		{
			name: 'Terms and Conditions',
			href: '/dashboard/terms-and-conditions/',
			icon: 'raphael:book',
			subRoutes: '-',
			canManagerAccess: true
		}
	]);
</script>

<div
	class="hidden bg-custom-gradient  min-w-[250px] max-w-[250px]   md:block h-screen text-white font-pt hidescrollbarthumb"
>
	<div
		class="flex flex-col justify-between h-[calc(100vh)] overflow-y-auto gap-2 hidescrollbarthumb"
	>
		<button class="sticky top-0 left-0 z-20 bg-custom-gradient" onclick={() => goto('/dashboard')}>
			<div
				class="shadow-sm min-h-[50px] cursor-pointer flex gap-2 justify-center items-center"
			>
				<img src='/dummyLogo.png'  width="120" class="py-1 " alt="">
				<!-- <p class="font-bold font-4xl py-5">Jeya Medical Enterprises</p> -->
			</div>
		</button>

		<nav class="flex flex-col items-start text-sm pl-4 h-full">
			{#each routes as route}
				{#if route.type === 'heading'}
					<h2 class="text-md text-white font-bold mt-2 mb-2">{route.name}</h2>
				{:else if !$writableGlobalStore.isManager || route.canManagerAccess}
					<div class="w-full rounded-md">
						<button
							class="w-full py-1"
							onclick={() => {
								if (route.href) goto(route.href);
							}}
						>
							<div
								class={`flex cursor-pointer items-center justify-start rounded-l-full p-2 pl-4 group transition-all duration-700 hover:bg-zinc-100 hover:scale-110 hover:text-black ${
									$page.url.pathname === route.href ||
									(route.href !== '/dashboard/' &&
										$page.url.pathname.startsWith(route.href ?? ''))
										? 'bg-zinc-100 text-black font-bold pl-4'
										: 'text-white'
								}`}
							>
								<Icon
									icon={route.icon ?? ''}
									class={`mr-2 h-6 w-6 ${
										$page.url.pathname === route.href ||
										(route.href !== '/dashboard/' &&
											$page.url.pathname.startsWith(route.href ?? ''))
											? 'text-black'
											: 'text-white group-hover:text-black'
									}`}
								/>
								<p
									class="text-md flex items-center gap-3 rounded-lg px-3 font-normal"
								>
									{route.name}
								</p>
							</div>
						</button>
					</div>
				{/if}
			{/each}
		
			<!-- <button
				class="w-full py-1 mt-auto"
				onclick={() => goto('/hidden-admin-base-007/dashboard/settings')}
			>
				<div
					class="flex cursor-pointer items-center my-2 bg-white text-[#1e3a8a] font-bold justify-start rounded-md p-2 hover:brightness-110"
				>
					<Icon icon={'uil:setting'} class="mr-2 h-6 w-6 text-[#1e3a8a]" />
					<p class="text-md flex text-[#1e3a8a] items-center gap-3 rounded-lg px-3 font-normal">
						Settings
					</p>
					<Icon icon={'ep:arrow-right-bold'} class="ml-auto h-4 w-4 text-[#1e3a8a]" />
				</div>
			</button> -->
		</nav>
	</div>
</div>

