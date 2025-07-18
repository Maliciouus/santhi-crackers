<script lang='ts'>
	import Footer from '$lib/components/footer.svelte';
    import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
    </script>

<div class="flex items-center py-10 justify-center  ">
    <div class=" p-4 rounded-lg  text-center max-w-md w-full">
      <div class="mb-6 flex items-center justify-center">
        <Icon icon="line-md:close-circle-twotone" style="color: #D76163" class="w-14 h-14" />
      </div>
      <h2 class="text-2xl text-[#191C1F] font-semibold mb-4">Payment Failed</h2>
      <p class="text-gray-600 mb-6">Pellentesque sed lectus nec tortor tristique accumsan quis dictum risus. Donec voluptat molestie nulla non facilisis.</p>
      <div class="flex justify-center space-x-4">
        <button onclick={()=>{goto('/')}} class="px-4 py-2 bg-[#F3FBFF] text-[#01A0E2] border border-[#0EA5E9]  rounded-lg ">Go to home</button>
        <button class="px-4 py-2 bg-[#01A0E2] text-white rounded-lg ">Retry</button>
      </div>
    </div>
</div>
<Footer />