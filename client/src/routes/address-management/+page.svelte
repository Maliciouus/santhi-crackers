<script lang="ts">
  import { createQuery, createMutation } from '@tanstack/svelte-query';
  import { _axios } from '$lib/_axios';
  import { toast } from 'svelte-sonner';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import Icon from '@iconify/svelte';
	import { queryClient } from '$lib/query-client';
	import { writableGlobalStore } from '$lib/stores/global-store';
	import { goto } from '$app/navigation';
  import Footer from '$lib/components/footer.svelte';

  interface Address {
    _id: string;
    receiverName: string;
    receiverMobile: string;
    flatorHouseno: string;
    area: string;
    landmark: string;
    latitude: number;
    longitude: number;
    addressType: string;
    isPrimary: boolean; 
  }
  
  $: isLoggedIn = $writableGlobalStore.isLogedIn;


  const addressesQuery = createQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      try {
        const response = await _axios.get('/address/all', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.data.status) throw new Error(response.data.message || 'Failed to fetch addresses');
        return response.data.addresses || [];
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Server error while fetching addresses');
      }
    },
    retry: 2,
    staleTime: 0,
  });

  const updateAddressMutation = createMutation({
    mutationFn: async ({ _id, updatedAddress }: { _id: string; updatedAddress: Omit<Address, '_id'> }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      const modifiedAddress = {
        ...updatedAddress,
        latitude: updatedAddress.latitude.toString(),
        longitude: updatedAddress.longitude.toString(),
      };

      try {
        const response = await _axios.put(`/address/${_id}`, modifiedAddress, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.data.status) throw new Error(response.data.message || 'Failed to update address');
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Server error while updating address');
      }
    },
    onSuccess: () => {
      $addressesQuery.refetch();
      toast.success('Address updated successfully!');
      isOpen = false;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update address');
    },
  });

  const addAddressMutation = createMutation({
    mutationFn: async (newAddress: Omit<Address, '_id'>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      const modifiedAddress = {
        ...newAddress,
        latitude: newAddress.latitude.toString(),
        longitude: newAddress.longitude.toString(),
      };

      try {
        const response = await _axios.post('/address/create', modifiedAddress, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.data.status) throw new Error(response.data.message || 'Failed to add address');
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Server error while adding address');
      }
    },
    onSuccess: () => {
      $addressesQuery.refetch();
      toast.success('Address added successfully!');
      isOpen = false;
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add address');
    },
  });

  const deleteAddressMutation = createMutation({
    mutationFn: async (_id: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      try {
        const response = await _axios.delete(`/address/${_id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.data.status) throw new Error(response.data.message || 'Failed to delete address');
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Server error while deleting address');
      }
    },
    onSuccess: () => {
      $addressesQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted successfully!');
      isDeleteConfirmOpen = false;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });

  const updatePrimaryAddressMutation = createMutation({
    mutationFn: async (addressId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found. Please log in.');

    try {
      const response = await _axios.post(`/address/set-primary/${addressId}`,  {}, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.data.status) throw new Error(response.data.message || 'Failed to update primary address');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Server error while updating primary address');
    }
  },
    onSuccess: () => {
      $addressesQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Primary address updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update primary address');
    },
  });

  let selectedAddress: Address | null = null;
  let isOpen = false;
  let isDeleteConfirmOpen = false;
  let mobileError = '';
  let newAddress: Omit<Address, '_id'> = {
    receiverName: '',
    receiverMobile: '',
    flatorHouseno: '',
    area: '',
    landmark: '',
    latitude: 0,
    longitude: 0,
    addressType: 'Home',
    isPrimary: false, 
  };
  $: if ($addressesQuery.data && $addressesQuery.data.length === 0 && isLoggedIn) {
    openDialog();
  }
  let map: L.Map | null = null;
  let marker: L.Marker | null = null;
  let mapContainer: HTMLDivElement;

  let isMounted = false;
  let errorMessage = '';
  let hasTriedGeolocation = false;

  onMount(() => {
    isMounted = true;
    return () => {
      isMounted = false;
      destroyMap();
    };
  });

  onDestroy(() => {
    destroyMap();
  });

  async function initMap(lat: number, lng: number) {
    if (!mapContainer || !isMounted || !L) return;

    destroyMap();

    const defaultLat = 51.505;
    const defaultLng = -0.09;

    map = L.map(mapContainer).setView([
      lat || defaultLat,
      lng || defaultLng
    ], 13);

    L.tileLayer("http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 19,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    marker = L.marker([lat || defaultLat, lng || defaultLng], {
      draggable: true
    }).addTo(map)
      .bindPopup('Drag to adjust location')
      .openPopup();

    marker.on('dragend', (e) => {
      const position = marker?.getLatLng();
      if (position) {
        newAddress.latitude = position.lat;
        newAddress.longitude = position.lng;
      }
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      newAddress.latitude = lat;
      newAddress.longitude = lng;

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map!);
      }
      marker.bindPopup('Drag to adjust location').openPopup();
    });
  }

  function destroyMap() {
    if (map) {
      map.off();
      map.remove();
      map = null;
    }
    if (marker) {
      marker.off();
      marker.remove();
      marker = null;
    }
  }

  async function getUserLocation() {
    if (hasTriedGeolocation) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                reject(new Error('Location access denied. Please enable location services in your browser settings.'));
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                reject(new Error('Location signal is weak or unavailable. Try again or use default location.'));
              } else {
                reject(new Error('Geolocation failed. Using default coordinates.'));
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          reject(new Error('Geolocation is not supported by this browser.'));
        }
      });

      const { latitude, longitude } = position.coords;
      newAddress.latitude = latitude;
      newAddress.longitude = longitude;
      hasTriedGeolocation = true;

      if (mapContainer && isMounted) {
        initMap(latitude, longitude);
        // toast.success('Location fetched successfully!');
      }

    } catch (error: any) {
      console.error('Geolocation error:', error);
      hasTriedGeolocation = true;
      errorMessage = error.message || 'Unable to retrieve your location automatically. Please allow location access, select a location on the map, or use default coordinates.';
      toast.error(errorMessage);

      if (mapContainer && isMounted) {
        initMap(51.505, -0.09);
      }
    }
  }

  function openDialog(address: Address | null = null) {
    if ($addressesQuery.data && $addressesQuery.data.length >= 5) {
      toast.error('Address limit reached. You can only have up to 5 addresses.');
      return;
    }
    isOpen = true;
    hasTriedGeolocation = false;
    errorMessage = '';
    if (address && selectedAddress) {
      newAddress = {
        receiverName: address.receiverName,
        receiverMobile: address.receiverMobile,
        flatorHouseno: address.flatorHouseno,
        area: address.area,
        landmark: address.landmark,
        latitude: address.latitude,
        longitude: address.longitude,
        addressType: address.addressType,
        isPrimary: address.isPrimary,
      };
      if (mapContainer && isMounted && L) {
        initMap(address.latitude, address.longitude);
      }
    } else {
      setTimeout(() => {
        if (mapContainer && isMounted && L) {
          getUserLocation();
        }
      }, 50);
    }
  }

  function closeDialog() {
    isOpen = false;
    selectedAddress = null;
    newAddress = {
      receiverName: '',
      receiverMobile: '',
      flatorHouseno: '',
      area: '',
      landmark: '',
      latitude: 0,
      longitude: 0,
      addressType: 'Home',
      isPrimary: false,
    };
    errorMessage = '';
    hasTriedGeolocation = false;
  }

  function filterNumericInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    newAddress.receiverMobile = input.value;
    validateMobile(input.value);
  }

  function validateMobile(mobile: string): boolean {
    const numericRegex = /^[0-9]*$/;
    if (!numericRegex.test(mobile)) {
      mobileError = 'Mobile number must contain only numeric values.';
      return false;
    }
    if (mobile.length !== 10) {
      mobileError = 'Mobile number must be exactly 10 digits.';
      return false;
    }
    mobileError = '';
    return true;
  }

  async function handleSaveAddress() {
    errorMessage = '';
    if (!newAddress.latitude || !newAddress.longitude) {
      errorMessage = 'Please select a location on the map or allow location access.';
      toast.error(errorMessage);
      return;
    }
    if (!newAddress.flatorHouseno) {
      toast.error("Flat/House number is required");
      return;
    }
    if (!newAddress.addressType) {
      toast.error("Address type is required");
      return;
    }
    if (!newAddress.area) {
      toast.error("Area is required");
      return;
    }
    if (!newAddress.receiverMobile) {
      toast.error("Receiver's mobile number is required");
      return;
    }
    if (!newAddress.receiverName) {
      toast.error("Receiver's name is required");
      return;
    }

    try {
      if (selectedAddress) {
        await $updateAddressMutation.mutateAsync({ _id: selectedAddress._id, updatedAddress: newAddress });
      } else {
        await $addAddressMutation.mutateAsync(newAddress);
      }
    } catch (error: any) {
      errorMessage = error.message || 'Failed to save address';
      toast.error(errorMessage);
    }
  }

  function openDeleteConfirm(address: Address) {
    selectedAddress = address;
    isDeleteConfirmOpen = true;
  }

  function closeDeleteConfirm() {
    isDeleteConfirmOpen = false;
    selectedAddress = null;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      closeDialog();
    }
  }

  function setPrimaryAddress(addressId: string) {
    $updatePrimaryAddressMutation.mutate(addressId);
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#if isLoggedIn}
<div class="max-w-2xl md:mx-auto mx-4  p-4 border my-20 rounded-lg shadow scrollbar-hide">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-3xl text-[#30363C] font-semibold">Address Management</h2>
    <Button onclick={openDialog} class="bg-custom-gradient  text-white px-4 py-2 rounded-md hover:scale-105 transition-all duration-300">
      Add Address
    </Button>
  </div>

  {#if $addressesQuery.isLoading}
    <Skeleton class="w-full h-20" />
  {:else if $addressesQuery.error}
    <p class="text-red-500">Error: {$addressesQuery.error.message}</p>
  {:else if $addressesQuery?.data.length === 0}
    <p class="text-gray-500">No addresses found</p>
  {:else}
    <div class="space-y-4">
      {#each $addressesQuery?.data as address}   
      <label class="flex items-center gap-1">
        <input
          type="radio"
          name="primaryAddress"
          checked={address?.isPrimary}
          onchange={() => setPrimaryAddress(address._id)}
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <span class="text-sm text-gray-600">Set as Primary</span>
      </label>
        <div class="border rounded-md p-4 bg-white shadow-sm">
          <div class="flex justify-between">
            <div class="space-y-2">
           
              <p class="font-medium text-lg text-[#4F585E]"> {address.addressType}</p>
              <p class="font-semibold text-xl text-[#30363C] capitalize">{address.flatorHouseno}, {address.area}, {address.landmark}</p>
              <p class="text-gray-700">{address.addressString}</p>
              <p class="text-base text-[#4F585E] flex gap-1 items-center capitalize">
                <Icon icon="rivet-icons:phone" class="w-4 h-4 text-[#4F585E]" />
                {address.receiverName}, {address.receiverMobile}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
          
              <Icon icon="cuida:edit-outline" class="w-6 h-7 text-[#4F585E] cursor-pointer hover:scale-105 transition-all" onclick={() => {selectedAddress = address; openDialog(address);}} />
              <Icon icon="cuida:trash-outline" class="w-7 h-7 text-[#4F585E] cursor-pointer hover:text-red-500" onclick={() => openDeleteConfirm(address)} />
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div  class={`fixed inset-0 bg-black/50 flex justify-end z-50 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
    <div class="w-full md:w-2/3  lg:w-1/3 h-full bg-white p-6 transform transition-transform duration-300 ease-in-out translate-x-full" style="transform: translateX({isOpen ? '0' : '100%'});">
      <!-- <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onclick={closeDialog}>
        ✕
      </button> -->
  
<div class="z-50">
  <h2 class="text-lg z-50 font-semibold mb-4 sticky top-0 flex items-center gap-2"><Icon onclick={closeDialog} icon="lucide:arrow-left" class="w-5 h-5 text-[#4F585E] cursor-pointer]"  /> {selectedAddress ? 'Edit Address' : 'Add Address'}</h2>
</div>  
   <div class="overflow-y-auto h-[95%] scrollbar-hide">
    <div class=" space-y-4">
      <div id="map" bind:this={mapContainer} class="h-64 w-full mb-4 border rounded-md"></div>
      <div class="flex space-x-2">
        {#each ['Home', 'Work', 'Other'] as option}
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <p
            onclick={() => (newAddress.addressType = option)}
            class="w-full p-2 border rounded-md cursor-pointer text-center transition-colors duration-200
                   {newAddress.addressType === option ? 'border-primary text-primary bg-primary/10' : 'border-[#A6AEB4]  text-[#A6AEB4] hover:bg-gray-100'}"
          >
            {option}
          </p>
        {/each}
      </div>
      <div>
        <label for="area" class="text-[#30363C] font-semibold text-xl">Area / Sector / Locality</label>
        <input type="text" bind:value={newAddress.area} placeholder="Enter area" class="w-full p-2 border rounded-md" required />
      </div>
      <div>
        <label for="flat" class="text-[#30363C] font-semibold text-xl">Flat / House no / Floor / Building</label>
        <input type="text" bind:value={newAddress.flatorHouseno} placeholder="Enter Flat / House no" class="w-full p-2 border rounded-md" required />
      </div>
      <div>
        <label for="landmark" class="text-[#30363C] font-semibold text-xl">Nearby landmark</label>
        <input type="text" bind:value={newAddress.landmark} placeholder="Enter landmark" class="w-full p-2 border rounded-md" />
      </div>
      <div class="space-y-4">
        <p class="text-[#4F585E] font-medium text-2xl">Receiver Detail</p>
        <div>
          <label for="name" class="text-[#30363C] font-semibold text-xl">Name</label>
          <input type="text" bind:value={newAddress.receiverName} placeholder="Enter receiver name" class="w-full p-2 border rounded-md" required />
        </div>
        <div>
          <label for="mobile" class="text-[#30363C] font-semibold text-xl">Mobile Number</label>
          <input
            type="tel"
            bind:value={newAddress.receiverMobile}
            placeholder="Enter mobile number"
            class="w-full p-2 border rounded-md"
            required
            pattern="[0-9]{10}"
            maxlength="10"
            oninput={(e) => filterNumericInput(e)}
            onblur={() => validateMobile(newAddress.receiverMobile)}
          />
          {#if mobileError}
            <p class="text-red-500 text-sm mt-1">{mobileError}</p>
          {/if}
        </div>
      </div>
    </div>
    <div class="mt-6">
      <Button onclick={handleSaveAddress} disabled={$addAddressMutation.isPending || $updateAddressMutation.isPending} class="w-full">
        {#if $addAddressMutation.isPending || $updateAddressMutation.isPending}
          Saving...
        {:else}
          {selectedAddress ? 'Update Address' : 'Save Address'}
        {/if}
      </Button>
    </div>
   </div>
    </div>
  </div>
  <div class={`fixed inset-0 bg-black/50 flex justify-center items-center z-50 ${isDeleteConfirmOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
    <div class="bg-white p-6 rounded-lg shadow-lg w-1/3">
      <h2 class="text-lg font-semibold mb-4">Confirm Delete</h2>
      <p class="mb-4">Are you sure you want to delete the address?</p>
      <div class="flex justify-end gap-4">
        <Button onclick={closeDeleteConfirm} variant="outline" class="px-4 py-2">Cancel</Button>
        <Button onclick={() => $deleteAddressMutation.mutate(selectedAddress!._id)} class="bg-red-500 text-white px-4 py-2 hover:bg-red-600">Delete</Button>
      </div>
    </div>
  </div>
</div>
{:else}
<div class="container max-w-2xl my-20 py-20 rounded-lg shadow-lg flex-col gap-3 flex justify-center items-center">
<p class="text-lg font-medium">Please login to Add Address</p>
<button onclick={()=>{goto('/login')}} class="bg-custom-gradient hover:scale-105 transition-all rounded-lg px-4 text-lg text-white py-2">Login</button>
</div>

{/if}
<Footer />