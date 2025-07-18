<!-- DemandBox.svelte -->
<script lang="ts">
	import { goto } from "$app/navigation";

    const illustrationSrc = "/images/illustra.png"; 
  </script>
  
  <section class="  pt-10 px-4 md:px-6 lg:px-8">
    <div class="flex flex-col lg:flex-row gap-8 items-center">
      <!-- Left Section -->
      <!-- <div class="relative flex flex-col items-start space-y-4">

        <img
          src={illustrationSrc}
          alt="Person with clipboard"
          class="absolute bottom-0 left-0 w-32 h-32 md:w-40 md:h-40 object-contain"
        />

        <h2 class="text-2xl md:text-3xl font-bold text-[#30363C]">
          Demand Products
        </h2>

        <p class="text-lg md:text-xl text-[#4F585E] leading-relaxed">
          Tell us the medical products you’re looking for, and we’ll do our best to
          make them available for you.
        </p>

        <button
          class="bg-[#01A0E2] text-white font-semibold py-2 px-6 rounded-md hover:bg-[#0187C2] transition-colors"
        >
          Upload Now
        </button>
      </div> -->
  
      <div class="flex items-end md:items-center lg:w-[100%] w-[100%] bg-[#D9E2F0] rounded-xl">
    <img src={illustrationSrc} class='illustration md:h-56 h-40 max-w-[35%] md:pt-10 pt-8' alt="">


<div class="flex flex-col demand items-start justify-center md:gap-4 py-2 gap-1 md:px-3 px-1">
    <h2 class="text-xl md:text-3xl font-bold text-[#30363C]">
        Demand Products
      </h2>

      <p class="text-base md:text-xl text-[#30363C] leading-relaxed ">
        Tell us the medical products you’re looking for, and we’ll do our best to
        make them available for you.
      </p>

      <button
      onclick={()=>{goto('/demand-products')}}
        class="bg-[#A7B9D5] text-[#2E4364]  font-semibold md:px-3 md:py-2 py-1 px-2 rounded-md hover:scale-110 transition-all"
      >
        Upload Now
      </button>
</div>
      </div>
      <!-- Right Section: Steps -->
      <!-- <div class="grid grid-cols-1 sm:grid-cols-2 lg:w-[60%] w-[100%] gap-6">
        <div class="flex items-start space-x-4">
          <div
            class="flex-shrink-0 w-8 h-12 rounded-full bg-[#E5ECF6] text-[#2E4364] flex items-center justify-center  text-lg"
          >
            1
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[#30363C]">
              Upload an image of the medical products you need.
            </h3>
          </div>
        </div>
  

        <div class="flex items-start space-x-4">
          <div
            class="flex-shrink-0 w-8 h-12 rounded-full bg-[#E5ECF6] text-[#2E4364] flex items-center justify-center  text-lg"
          >
            2
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[#30363C]">
              Enter the product names for better clarity.
            </h3>
          </div>
        </div>
  
        <div class="flex items-start space-x-4">
          <div
            class="flex-shrink-0 w-8 h-12 rounded-full bg-[#E5ECF6] text-[#2E4364] flex items-center justify-center text-lg"
          >
            3
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[#30363C]">
              Click “Demand Products” to submit your request.
            </h3>
          </div>
        </div>
  
        <div class="flex items-start space-x-4">
          <div
            class="flex-shrink-0 w-8 h-12 rounded-full bg-[#E5ECF6] text-[#2E4364] flex items-center justify-center  text-lg"
          >
            4
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[#30363C]">
              Sit back and relax! Your requested products will be available soon.
            </h3>
          </div>
        </div>
      </div> -->
    </div>
  </section>
  <style>
    @media (max-width: 350px) {
      .illustration {
        display: none;
      }
      /* Increase padding slightly when image is hidden to center content */
      .demand {
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }
  </style>