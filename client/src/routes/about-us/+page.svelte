<!-- about-us.svelte -->
<script lang="ts">
    import Footer from '$lib/components/footer.svelte';
    import { onMount, onDestroy } from 'svelte';
  
    let map: L.Map | null = null;
    let mapContainer: HTMLDivElement;
    let L: typeof import('leaflet');
  
    onMount(async () => {
      // Dynamically import Leaflet only on client side
      L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
  
      if (!mapContainer) return;
  
      // Rest of your map initialization code...
      map = L.map(mapContainer).setView([8.183538566165574, 77.40885283254259], 13);
      
      L.tileLayer('http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 19,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps',
      }).addTo(map);
  
      L.marker([8.183538566165574, 77.40885283254259])
        .addTo(map)
        .bindPopup('Store Location')
        .openPopup();
    });
  
    onDestroy(() => {
      if (map) {
        map.remove();
        map = null;
      }
    });
  </script>

<div class="mx-auto lg:p-6 px-4 bg-white py-12">
  <div class="flex flex-col  xl:gap-20 gap-10  items-center md:container">
    <!-- Left Section: About Us Text and Image -->
    <div class=" flex lg:flex-row flex-col  xl:gap-20 md:gap-10 gap-5  items-center  lg:items-start">
    <div class="lg:w-1/4  w-full  flex items-center border lg:border-none shadow-md lg:shadow-none justify-center">
        <img
        src="/images/about.png"
        alt="About Us Image"
        class="h-96 w-80 lg:border object-cover rounded-lg lg:shadow-md"
      />
    </div>
      <div class="lg:w-3/4 w-full flex flex-col gap-5">
        <h2 class="text-3xl font-semibold text-[#30363C] mt-4">About Us</h2>
      <p class="  text-justify text-xl text-[#4F585E]">
        We partner directly with trusted manufacturers and brands to ensure genuine products, competitive prices, and a seamless shopping experience. From electronics and fashion to home goods and more, everything you need is just a click away.
      </p>
      </div>
    </div>

    <!-- Right Section: Map -->
    <div class=" w-full mb-10 h-[300px] rounded-lg overflow-hidden shadow-md">
      <div id="map" bind:this={mapContainer} class="w-full h-full"></div>
    </div>
  </div>
</div>
<Footer />

