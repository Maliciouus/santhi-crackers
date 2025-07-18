<script lang="ts">
    import { _axios } from "$lib/_axios";
    import { createMutation } from "@tanstack/svelte-query";
    import { toast } from "svelte-sonner";
    import type { AxiosResponse } from "axios";
    import { goto } from '$app/navigation';
    import { productEditStore } from "./schema";
    import { queryClient } from "$lib/query-client";
    import Icon from "@iconify/svelte";
    import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';

    let fileInput: HTMLInputElement | null = null;

    function triggerFileInput() {
        fileInput?.click();
    }
    
    async function generatePDFReport() {
        if (!uploadResults) {
        toast.error("No upload results available for report generation.");
        return;
    }
    const pdfDoc = await PDFDocument.create();
    
    let page = pdfDoc.addPage([600, 800]); // Set page size
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 12;
    const { width, height } = page.getSize();
    const lineHeight = fontSize * 1.5;
    const margin = 50;
    let yOffset = page.getHeight() - margin;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title
    page.setFont(fontBold);
    page.drawText("Bulk Upload Error Report", { 
        x: page.getWidth() / 2 - 100, 
        y: yOffset, 
        size: 18, 
        font: fontBold,
        color: rgb(0, 0, 0)
    });
    yOffset -= lineHeight * 2;
    page.setFont(font);
    page.drawText(`Total Uploads: ${uploadResults.successCount + uploadResults.errorCount}`, { x: margin, y: yOffset, size: fontSize });
    yOffset -= lineHeight*2;
    page.drawText(`Successful Uploads: ${uploadResults.successCount}`, { x: margin, y: yOffset, size: fontSize, color: rgb(0, 0, 0) });
    yOffset -= lineHeight*2;
    page.drawText(`Failed Uploads: ${uploadResults.errorCount}`, { x: margin, y: yOffset, size: fontSize, color: rgb(0, 0, 0) });
    yOffset -= lineHeight * 2;
    const wrapText = (text: string, maxWidth: number, font: PDFFont, size: number) => {
        const words = text.split(" ");
        let lines = [];
        let currentLine = "";

        for (const word of words) {
            const testLine = currentLine + (currentLine ? " " : "") + word;
            const textWidth = font.widthOfTextAtSize(testLine, size);

            if (textWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) lines.push(currentLine);
        return lines;
    };

    page.drawText("File Name", { x: margin, y: yOffset, size: fontSize, font: fontBold });
        page.drawText("Error Reason", { x: margin + 200, y: yOffset, size: fontSize, font: fontBold });
        yOffset -= lineHeight*2;
    for (const failure of uploadResults.failedUploads) {
        let nameLines = wrapText(failure.name, 180, font, fontSize);
        let reasonLines = wrapText(failure.reason, 200, font, fontSize);

        for (let i = 0; i < Math.max(nameLines.length, reasonLines.length); i++) {
            page.drawText(nameLines[i] || "", { x: margin, y: yOffset, size: fontSize, color: rgb(0.8, 0, 0) });
            page.drawText(reasonLines[i] || "", { x: margin + 200, y: yOffset, size: fontSize, color: rgb(0.8, 0, 0) });
            yOffset -= lineHeight;

            if (yOffset < 50) {
                page = pdfDoc.addPage();
                yOffset = height - margin;
            }
        }

        yOffset -= lineHeight * 1.3; // Extra space between entries
    }
        const pdfBytes = await pdfDoc.save();
        downloadPDF(pdfBytes, "error_report.pdf");
    }

    function downloadPDF(pdfBytes: Uint8Array, fileName: string) {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    let files: File[] = [];
    let isUploading = false;
    let uploadResults: {
        successCount: number;
        errorCount: number;
        updatedProducts: string[];
        failedUploads: Array<{ name: string; reason: string }>;
    } | null = null;
    
    function handleFiles(event: Event): void {
        uploadResults = null;
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const selectedFiles = Array.from(target.files);
            const validFiles = selectedFiles.filter(file => file.size <= 2 * 1024 * 1024);
            const invalidFiles = selectedFiles.filter(file => file.size > 2 * 1024 * 1024);
            
            if (invalidFiles.length > 0) {
                toast.error(`${invalidFiles.length} file(s) exceed 2MB limit and were not added.`);
            }
            
            files = [...files, ...validFiles];
        }
        target.value = '';
    }
  
    function removeFile(index: number): void {
        files = files.filter((_, i) => i !== index);
        if (files.length === 0) {
            uploadResults = null;
        }
    }
  
    function handleDrop(event: DragEvent): void {
        event.preventDefault();
        uploadResults = null;
        const droppedFiles = event.dataTransfer?.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const selectedFiles = Array.from(droppedFiles);
            const validFiles = selectedFiles.filter(file => file.size <= 2 * 1024 * 1024);
            const invalidFiles = selectedFiles.filter(file => file.size > 2 * 1024 * 1024);
            
            if (invalidFiles.length > 0) {
                toast.error(`${invalidFiles.length} file(s) exceed 2MB limit and were not added.`);
            }
            
            files = [...files, ...validFiles];
        }
    }
  
    function handleDragOver(event: DragEvent): void {
        event.preventDefault();
    }
  
    const mutation = createMutation({
        mutationFn: async (data: FormData): Promise<AxiosResponse> => {
            return _axios.post("/product/bulk-upload-images", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
        },
        onSuccess: ({ data }) => {
            uploadResults = {
                successCount: data.successCount,
                errorCount: data.errorCount,
                updatedProducts: data.updatedProducts,
                failedUploads: data.failedUploads
            };

            if (data.status) {
                toast.success(data.message);
                if (data.successCount === files.length) {
                    setTimeout(() => {
                        $productEditStore.mode = 'list';
                        queryClient.refetchQueries({ queryKey: ['products fetch'] });
                        goto('/hidden-admin-base-007/dashboard/products?mode=list');
                        resetState();
                    }, 2000);
                }
                files=[]
            } else {
                toast.error(data.message);
                files=[]
            }
            isUploading = false;
            files=[]
        },
        onError: (error) => {
            toast.error("Upload Failed ❌");
            console.error("Upload Error:", error);
            isUploading = false;
            uploadResults = null;
        }
    });
  
    function resetState() {
        files = [];
        uploadResults = null;
        isUploading = false;
    }
  
    async function uploadFiles() {
        if (files.length === 0) {
            toast.error("No files selected!");
            return;
        }
    
        isUploading = true;
        uploadResults = null;
        const formData = new FormData();
        files.forEach(file => formData.append("images", file));
    
        try {
         $mutation.mutate(formData);
        } catch (error) {
            isUploading = false;
        }
    }
</script>
  
<main class="flex flex-col items-center mt-10">
    <div class="p-4 rounded-md w-[80%] ">
        <div class="bg-zinc-200 mb-10 flex justify-between items-center shadow-md rounded-md p-4 text-zinc-900">
            <p class="text-lg font-bold">Bulk Image Upload</p>
        </div>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div class="border-2 border-dashed flex justify-center items-center min-h-40 border-zinc-400 p-6 rounded-md text-center cursor-pointer" 
             ondragover={handleDragOver} 
             ondrop={handleDrop} 
             role="presentation" 
             tabindex="0">
            <input 
                type="file" 
                accept=".jpg, .jpeg, .png, .webp"
                multiple 
                class="hidden" 
                bind:this={fileInput} 
                onchange={handleFiles} 
            />
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="block text-xl cursor-pointer" onclick={triggerFileInput}>
                Drag & Drop files or <span class="text-blue-500">Browse</span>
            </label>
        </div>
        <p class="text-sm py-2">*Each image must be under 2MB.</p>


        {#if files.length > 0}
    <div class="mt-4">
        <div class="max-h-64 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-zinc-400 scrollbar-track-zinc-200">
            {#each files as file, index}
                <div class="flex justify-between bg-zinc-300 p-2 rounded-md mb-2">
                    <span class="truncate w-3/4">{file.name}</span>
                    <button class="text-red-500 text-lg font-bold" onclick={() => removeFile(index)} type="button">
                        <Icon class="w-4 h-4" icon="line-md:menu-to-close-alt-transition" />
                    </button>
                </div>
            {/each}
        </div>
        <button 
            class="bg-blue-500 text-white w-full py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed" 
            type="button" 
            onclick={uploadFiles} 
            disabled={isUploading}
        >
            {isUploading ? 'Uploading...' : 'Upload Files'}
        </button>
    </div>
{/if}


        {#if uploadResults}
        <button 
    class="bg-red-600 text-white w-full py-2 rounded-lg hover:bg-green-600 mt-2" 
    onclick={generatePDFReport}
>
    Download Error Report
</button>
            <div class="mt-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-400 mb-4 border rounded-base border-red-500">
                <div class="bg-zinc-100 p-4 rounded-md">
                    <div class="flex justify-between mb-2">
                        <span class="font-semibold">Upload Summary:</span>
                        <div class="space-x-4">
                            <span class="text-green-600">{uploadResults.successCount} succeeded</span>
                            <span class="text-red-600">{uploadResults.errorCount} failed</span>
                        </div>
                    </div>
                    {#if uploadResults.failedUploads.length > 0}
                        <div class="mt-2">
                            <p class="font-semibold text-red-600 mb-2">Errors:</p>
                            {#each uploadResults.failedUploads as failure}
                                <div class="p-2 rounded mb-1 text-sm">
                                    <span class="font-medium">{failure.name}:</span> {failure.reason}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</main>