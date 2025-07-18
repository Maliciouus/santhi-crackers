<script lang="ts">
    import { _axios } from "$lib/_axios";
    import { createMutation } from "@tanstack/svelte-query";
    import { toast } from "svelte-sonner";
    import type { AxiosResponse } from "axios";
	import { goto } from '$app/navigation';
	import { productEditStore } from "./schema";
	import { queryClient } from "$lib/query-client";
  
    let file: File | null = null;
    let isUploading = false;
    let errorMessages: string[] = [];
    let successCount=0;
    let errorCount=0;
    let errorFileUrl: null=null;
    $: file;

 
    function handleFiles(event: Event): void {
        errorMessages=[]
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const selectedFile = target.files[0];
        if (selectedFile.name.endsWith(".xlsx")) {
          file = selectedFile;
        } else {
          toast.error("Only .xlsx files are allowed!");
        }
      }
      target.value = '';
    }
  
    function removeFile(): void {
        errorMessages=[]
      file = null;
      errorCount = 0;
        successCount = 0;
        errorFileUrl = null;
    }
  
    function handleDrop(event: DragEvent): void {
      event.preventDefault();
        errorMessages=[]
        errorCount=0
        successCount=0
      const droppedFiles = event.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        const selectedFile = droppedFiles[0];
        if (selectedFile.name.endsWith(".xlsx")) {
          file = selectedFile;
        } else {
          toast.error("Only .xlsx files are allowed!");
        }
      }
    }
  
    function handleDragOver(event: DragEvent): void {
      event.preventDefault();
    }
  
    const mutation = createMutation({
      mutationFn: async (data: FormData): Promise<AxiosResponse> => {
        return _axios.post("/product/bulk-create", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      },
      onSuccess: ({ data }) => {
        if (data.status||data.errorCount===0) {
            file = null;
        toast.success(data.message || "File Uploaded Successfully ✅");
        $productEditStore.mode = 'list';
        queryClient.refetchQueries({
				queryKey: ['products fetch']
			});
       goto('/hidden-admin-base-007/dashboard/products?mode=list');
       resetState();
      } else {
        toast.error(data.message || "Upload Failed ❌");
        errorMessages = data.errors || [];
        if (data.file) {
            successCount=data.successCount;
            errorCount=data.errorCount;
        errorFileUrl = data.file;
      }
      file = null;
        isUploading = false;
      }
      },
      onError: (error) => {
        file = null;
        toast.error("Upload Failed ❌");
      console.error("Upload Error:", error);
        isUploading = false;
      }
    });
    function resetState() {
        file = null;
        errorCount = 0;
        successCount = 0;
        errorMessages = [];
        errorFileUrl = null;
        isUploading = false;
    }
    async function uploadFile() {
        errorMessages=[]
      if (!file) {
        toast.error("No file selected!");
        return;
      }
  
      isUploading = true;
      errorMessages = [];
      const formData = new FormData();
      formData.append("file", file);
  
      try {
        await $mutation.mutateAsync(formData);
        file = null;
      } catch (error) {
        file = null;
        isUploading = false;
      }
    }
  

	function handleUploadClick() {
errorCount=0;
successCount=0;
errorMessages=[];
errorFileUrl=null
	}
</script>
  
  <main class="flex flex-col items-center mt-10">
    <div class="p-4 rounded-md w-[80%]">
      <div class=" bg-zinc-200 mb-10  justify-between items-center flex shadow-md rounded-md p-4 text-zinc-900">
   <p class="text-lg  font-bold">
    Bulk Upload
    </p>
    <p class=" text-blue-500 hover:underline hover:text-blue-700">
        <a class="" href="https://docs.google.com/spreadsheets/d/15J3pIoaz0YUvHtQHKcbPjyj2M3ZEJ0gPufcg7e9KOMg/edit?usp=sharing" target="_blank">
            View Sample
          </a>
      </p>

   </div>
    

    
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div
        class="border-2 border-dashed flex justify-center items-center min-h-40 border-zinc-400 p-6 rounded-md text-center cursor-pointer"
        ondragover={handleDragOver}
        ondrop={handleDrop}
        role="presentation"
        tabindex="0"
        aria-label="Drop file here or click to browse"
      >
        <input
          type="file"
          class="hidden"
          onchange={handleFiles}
          id="fileInput"
          onclick={handleUploadClick}
          accept=".xlsx"
        />
        <label for="fileInput" class="block text-xl">
          Drag & Drop file or <span class="text-blue-500 cursor-pointer">Browse</span>
        </label>
      </div>
      <p class="text-sm py-2">*Only files with .xlsx extension is allowed</p>
  
      <!-- File Display -->
      {#if file}
        <div class="mt-4">
          <div class="flex justify-between bg-zinc-300 p-2 rounded-md mb-2">
            <span class="truncate w-3/4">{file.name}</span>
            <button
              class="text-red-500 font-bold"
              onclick={removeFile}
              type="button"
              aria-label="Remove {file.name}"
            >
              ×
            </button>
          </div>
        </div>
  
        <!-- Upload Button -->
        <button
          class="bg-blue-500 text-white w-full py-2 mt-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          type="button"
          onclick={uploadFile}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      {/if}
      {#if errorFileUrl}
  <div class="mt-4">
    <a
      href={errorFileUrl}
      download="upload_errors.xlsx"
      class="bg-red-500 text-white w-full py-2 mt-2 rounded-md hover:bg-red-600 block text-center"
    >
      Download Error Report
    </a>
  </div>
{/if}
{#if errorMessages.length > 0 || errorCount > 0 || successCount > 0}
<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 rounded-md">
    <p class="font-bold">Upload Summary:</p>
    <ul class="mt-2">
        {#if successCount > 0}
            <li class="text-sm "><strong>Success Count:</strong> {successCount}</li>
        {/if}
        {#if errorCount > 0}
            <li class="text-sm "><strong>Error Count:</strong> {errorCount}</li>
        {/if}
        {#each errorMessages as error}
        <li class="text-sm">{error}</li>
      {/each}
    </ul>
</div>
{/if}
    </div>
  </main>