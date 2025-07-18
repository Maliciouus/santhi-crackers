<script lang='ts'>
    import Footer from '$lib/components/footer.svelte';
    import Icon from '@iconify/svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    let id: string = '';
    
    $: {
        id = $page.params.id || '';
    }
</script>

<div class="flex items-center py-10 justify-center">
    <div class="p-4 rounded-lg text-center max-w-md w-full">
        <div class="mb-6 flex items-center justify-center">
            <Icon icon="line-md:circle-to-confirm-circle-twotone-transition" class="w-14 h-14 text-[#2DB224] font-thin" />
        </div>
        <h2 class="text-2xl text-[#191C1F] font-semibold mb-4">Your order is successfully placed</h2>
        <p class="text-gray-600 mb-6">Pellentesque sed lectus nec tortor tristique accumsan quis dictum risus. Donec voluptat molestie nulla non facilisis.</p>
        <div class="flex justify-center space-x-4">
            <button on:click={() => goto('/')} class="px-4 py-2 bg-[#faf3ff] text-primary border border-primary rounded-lg">Go to home</button>
            <button on:click={() => goto(`/order-history/${id}`)} class="px-4 py-2 bg-custom-gradient text-white rounded-lg">View Order</button>
        </div>
    </div>
</div>
<Footer />