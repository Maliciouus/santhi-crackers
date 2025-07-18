<script lang="ts">
  import { _axios } from '$lib/_axios';
  import { createQuery } from '@tanstack/svelte-query';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { imgUrl } from '$lib/config';
  import * as Table from '$lib/components/ui/table';
  import * as Tabs from '$lib/components/ui/tabs';
  import Icon from '@iconify/svelte';
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { toast } from 'svelte-sonner';
  import * as Select from "$lib/components/ui/select/index.js";
  import Paginator from '$lib/components/paginator.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import { Button } from '$lib/components/ui/button';
  import { tick } from 'svelte';

  // Pagination and search variables
  let page = $state(1);
  let limit = $state(5);
  let search = $state('');
  let total = $state(0);

  // Debounce search functionality
  let debounceTimeout: any;
  function debounceSearch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      await tick();
      page = 1; // Reset to first page on search
      $demandQuery.refetch();
    }, 500);
  }

  // Define the query to fetch demand data with pagination
  const demandQuery = createQuery({
    queryKey: ['demand', page, limit, search],
    queryFn: async () => {
      const response = await _axios.get('/demand/', {
        params: {
          page,
          limit,
          q: search // Assuming API accepts 'q' for search query
        }
      });
      total = response.data.total || 0;
      return response.data;
    },
    select: (data) => data.data,
    retry: 1,
    staleTime: 0,
    enabled: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Reactive variables
  const demandData = $derived($demandQuery.data || []);
  const isLoading = $derived($demandQuery.isLoading);
  const isFetching = $derived($demandQuery.isFetching);

  // Image Dialog control
  let imageDialogOpen = false;
  let currentImageUrl = '';

  // Function to open the dialog with a specific image
  function openImageDialog(imageUrl: string) {
    currentImageUrl = imageUrl;
    imageDialogOpen = true;
  }

  // Function to close the dialog
  function closeImageDialog() {
    imageDialogOpen = false;
  }

  // Handle click outside
  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('dialog-backdrop')) {
      closeImageDialog();
    }
  }

  // Notification Dialog control
  let notificationDialogOpen = false;
  let selectedUserId = '';
  let selectedUserName = '';
  let selectedUserMobile = '';
  let notificationTitle = '';
  let demandId = '';
  let notificationDescription = '';
  let isSubmitting = false;
  let notificationType = '';

  // Function to open notification dialog
  function openNotificationDialog(userId: string, username: string, mobile: string, demand_id: string) {
    selectedUserId = userId;
    selectedUserName = username || 'N/A';
    selectedUserMobile = mobile || 'N/A';
    demandId = demand_id;
    notificationTitle = '';
    notificationDescription = '';
    notificationType = 'demand'; // Default to 'demand'
    notificationDialogOpen = true;
  }

  // Function to close notification dialog
  function closeNotificationDialog() {
    notificationDialogOpen = false;
    selectedUserId = '';
    selectedUserName = '';
    selectedUserMobile = '';
    demandId = '';
    notificationTitle = '';
    notificationDescription = '';
    notificationType = '';
  }

  // Function to handle notification form submission
  async function handleNotificationSubmit() {
    if (!notificationTitle || !notificationDescription || !notificationType) {
      toast.error('Please fill in all fields, including notification type');
      return;
    }
    if (!demandId) {
      toast.error('Demand ID is missing');
      return;
    }

    isSubmitting = true;

    try {
      const response = await _axios.post('/notification/create', {
        userId: selectedUserId,
        title: notificationTitle,
        description: notificationDescription,
        type: notificationType,
        demand: demandId,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('Notification sent successfully');
        closeNotificationDialog();
        $demandQuery.refetch(); // Refresh demand data
      } else {
        toast.error('Failed to send notification');
      }
    } catch (error) {
      toast.error('Error sending notification');
      console.error('Notification error:', error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="flex flex-col min-h-screen">
  <Tabs.Root value="list" class="w-full p-4 flex-1">
    <Tabs.List>
      <Tabs.Trigger value="list" class="flex items-center gap-2">
        <Icon class="w-4 h-4" icon="tabler:table" />
        <span>Demand List</span>
      </Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="list" class="flex-1 flex flex-col">
      <!-- Table Structure -->
      <div class="flex-1 overflow-y-auto px-4">
        <div class="mx-auto w-[calc(100vw-420px)] max-h-[calc(100vh-300px)]">
          <Table.Root>
            {#if isLoading || isFetching}
              <Table.Caption>Loading...</Table.Caption>
            {:else if total === 0}
              <Table.Caption class="text-center w-full text-xs">No Demands Found!</Table.Caption>
            {/if}
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-[100px]">Sl.No</Table.Head>
                <Table.Head>Product Name</Table.Head>
                <Table.Head class="flex items-center justify-center">Image</Table.Head>
                <Table.Head>Quantity</Table.Head>
                <Table.Head>Preferred Brand</Table.Head>
                <Table.Head>Time Preference</Table.Head>
                <Table.Head>Rate Preference</Table.Head>
                <Table.Head>Message</Table.Head>
                <Table.Head>Response</Table.Head>
                <Table.Head>Created By</Table.Head>
                <Table.Head>Notify</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#if isLoading || isFetching}
                {#each Array(5) as _}
                  <Table.Row>
                    {#each Array(11) as _}
                      <Table.Cell>
                        <Skeleton class="h-6 w-full bg-gray-200" />
                      </Table.Cell>
                    {/each}
                  </Table.Row>
                {/each}
              {:else if demandData.length > 0}
                {#each demandData as demand, i}
                  <Table.Row>
                    <Table.Cell>{(page - 1) * limit + i + 1}</Table.Cell>
                    <Table.Cell>{demand.productName}</Table.Cell>
                    <Table.Cell class="flex items-center justify-center">
                      <img
                        src={imgUrl + demand.file}
                        alt={demand.productName}
                        class="w-16 h-16 object-contain rounded-lg cursor-pointer hover:opacity-80"
                        on:click={() => openImageDialog(imgUrl + demand.file)}
                        on:keydown={(e) => e.key === 'Enter' && openImageDialog(imgUrl + demand.file)}
                        tabindex="0"
                      />
                    </Table.Cell>
                    <Table.Cell>{demand.quantity}</Table.Cell>
                    <Table.Cell>{demand.brandName}</Table.Cell>
                    <Table.Cell>{demand.timePreference}</Table.Cell>
                    <Table.Cell>{demand.ratePreference}</Table.Cell>
                    <Table.Cell>{demand.message}</Table.Cell>
                    <Table.Cell>{demand.response || '-'}</Table.Cell>
                    <Table.Cell>
                      {#if demand.userId}
                        <div>
                          <p>User: {demand.userId.username || 'N/A'}</p>
                          <p>Mobile: {demand.userId.mobile || 'N/A'}</p>
                          <p>{new Date(demand.createdAt).toLocaleString()}</p>
                        </div>
                      {:else}
                        <p>User: N/A</p>
                        <p>Mobile: N/A</p>
                        <p>{new Date(demand.createdAt).toLocaleString()}</p>
                      {/if}
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        class="text-blue-600 hover:text-blue-800 transition-colors"
                        on:click|stopPropagation={() => demand.userId && openNotificationDialog(
                          demand.userId._id,
                          demand.userId.username,
                          demand.userId.mobile,
                          demand._id
                        )}
                      >
                        <Icon class="w-6 h-6" icon="mdi:bell-check" />
                      </button>
                    </Table.Cell>
                  </Table.Row>
                {/each}
              {:else}
                <Table.Row>
                  <Table.Cell colspan="11" class="text-center text-gray-500 py-4">
                    No demand data available.
                  </Table.Cell>
                </Table.Row>
              {/if}
            </Table.Body>
          </Table.Root>
        </div>
      </div>

      <!-- Pagination Component -->
      {#if !isLoading && total > 0}
        <div class="mt-4 px-4">
          <div class="flex justify-between items-center">
      
            <Paginator
              total={total}
              {limit}
              {page}
              callback={(_page: number) => {
                if (_page === page) return;
                page = _page;
                $demandQuery.refetch();
              }}
            />
          </div>
        </div>
      {/if}
    </Tabs.Content>
  </Tabs.Root>
</div>

<!-- Custom Dialog for Image Preview -->
{#if imageDialogOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center dialog-backdrop bg-black bg-opacity-60"
    on:click={handleOutsideClick}
  >
    <div class="relative max-w-[80%] max-h-[80vh] rounded-lg overflow-hidden shadow-xl">
      <button
        class="absolute top-2 right-2 z-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
        on:click={closeImageDialog}
      >
        <Icon icon="mdi:close" class="w-5 h-5" />
      </button>
      <div class="flex justify-center items-center p-2">
        <img
          src={currentImageUrl}
          alt="Demand Image"
          class="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      </div>
    </div>
  </div>
{/if}

<!-- Notification Dialog -->
<Dialog.Root bind:open={notificationDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Send Notification</Dialog.Title>
      <Dialog.Description>
        Send a notification to {selectedUserName} (Mobile: {selectedUserMobile}) regarding their demand.
      </Dialog.Description>
    </Dialog.Header>
    <form on:submit|preventDefault={handleNotificationSubmit} class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <label for="title" class="text-right font-medium">Notification Title:</label>
        <input
          id="title"
          type="text"
          bind:value={notificationTitle}
          class="col-span-3 h-10 rounded-md border bg-white focus:ring-0 focus:outline-none border-gray-300 px-3 py-2"
          placeholder="Enter notification title"
          required
        />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <label for="description" class="text-right font-medium">Notification Content:</label>
        <textarea
          id="description"
          bind:value={notificationDescription}
          class="col-span-3 h-24 rounded-md border bg-white border-gray-300 focus:ring-0 focus:outline-none px-3 py-2"
          placeholder="Enter notification description"
          required
        ></textarea>
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <label for="notificationType" class="text-right font-medium">Notification Type:</label>
        <div class="col-span-3">
          <Select.Root bind:value={notificationType}>
            <Select.Trigger class="w-[180px] bg-white border-gray-300">
              <Select.Value placeholder="Select type" />
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Item value="other">Other</Select.Item>
                <Select.Item value="demand">Demand</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
      </div>
      <Dialog.Footer>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            on:click={closeNotificationDialog}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Notify'}
          </button>
        </div>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* Ensure the table container can scroll vertically */
  .table-container {
    overflow-y: auto;
    max-height: calc(100vh - 300px); /* Adjust based on header/footer height */
  }

  /* Prevent parent containers from hiding overflow */
  :global(.tabs-content) {
    overflow: visible !important;
  }

  /* Ensure the root container doesn't restrict scrolling */
  :global(html, body, #app) {
    overflow-y: auto !important;
    height: 100%;
  }
</style>