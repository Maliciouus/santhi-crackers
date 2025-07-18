<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { _axios } from '$lib/_axios';
  import { createQuery } from '@tanstack/svelte-query';
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "$lib/components/ui/dropdown-menu";

  interface Quote {
    _id: string;
    quote: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }

  interface QuoteResponse {
    message: string;
    data: Quote[];
    status: boolean;
  }
</script>

<style>
  .social-icon {
    width: 20px;
    height: 20px;
    margin: 0 4px;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }

  .responsive-text {
    font-size: clamp(0.7rem, 2vw, 1rem);
  }

</style>

<div class=" bg-custom-gradient px-1 md:px-8 w-screen lg:px-8 h-[44px] -mt-1 flex z-30 items-center justify-center py-1 text-white">
  <div class="flex relative items-center justify-between w-full px-4">
    <!-- Social Icons -->
    <div class="flex items-center">
      <img src="/svg/instagram.svg" alt="Instagram" class="social-icon" />
      <img src="/svg/facebook.svg" alt="Facebook" class="social-icon" />
      <img src="/svg/youtube.svg" alt="YouTube" class="social-icon" />
      <img src="/svg/whatsapp-gold.svg" alt="WhatsApp" class="social-icon" />
    </div>

    <!-- Cracker Images -->
    <div class="absolute right-[30%] hidden lg:flex justify-center pointer-events-none">
      <img src="/svg/fireworks.svg" alt="Fireworks" class="h-6 w-auto" />
    </div>
    <div class="text-center">
      <span class="text-white text-nowrap lg:block hidden responsive-text">💥 Welcome to Firebloom Elite Crackers World 💥</span>
      </div>
    <div class="absolute lg:left-[20%] left-[30%] flex justify-center pointer-events-none">
      <img src="/svg/fireworks.svg" alt="Fireworks" class="h-6 w-auto" />
    </div>
    <!-- Contact Icons -->
    <div class="flex items-center gap-2">
      <div class="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div class="flex items-center">
              <img src="/svg/telephone.svg" alt="Phone" class="social-icon" />
              <span class="ml-1 text-nowrap responsive-text bg-gradient-to-r from-[#FCF0D5] via-[#F6C17A] to-[#FFC794] bg-clip-text text-transparent">
                +91 78569 78974
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>+91 78569 78974</DropdownMenuItem>
            <DropdownMenuItem>+91 98765 43210</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div class="flex items-center">
        <img src="/svg/whatsapp.svg" alt="WhatsApp" class="social-icon" />
        <span class="ml-1 text-nowrap responsive-text bg-gradient-to-r from-[#FCF0D5] via-[#F6C17A] to-[#FFC794] bg-clip-text text-transparent">
          +91 78569 78974
        </span>
      </div>
    </div>
  </div>
</div>
