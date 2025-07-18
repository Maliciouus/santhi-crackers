<script lang="ts">
    import { onMount } from 'svelte';
    import { _axios } from '$lib/_axios';
	import Footer from '$lib/components/footer.svelte';
  
    let privacyPolicy = '';
  
    onMount(async () => {
      try {
        // Inject styles dynamically
        injectStyles();
        
        const response = await _axios.get('/ppolicy');
        if (response.data.status) {
          privacyPolicy = response.data.data.content || 'No privacy policy content available.';
        } else {
          privacyPolicy = 'Failed to load privacy policy.';
        }
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
        privacyPolicy = 'Error loading privacy policy.';
      }
    });

    function injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* Override Tailwind specifically for privacy content */
        .privacy-content {
          line-height: 1.8 !important;
          color: #2d3748 !important;
          font-size: 16px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      
        /* Force override any existing styles */
        .privacy-content * {
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
      
        /* Typography styles that override Tailwind */
        .privacy-content p {
          margin-bottom: 16px !important;
          line-height: 1.7 !important;
          color: #2d3748 !important;
          font-size: 16px !important;
        }
      
        .privacy-content h1 {
          font-size: 32px !important;
          font-weight: 900 !important;
          color: #1a202c !important;
          margin-top: 32px !important;
          margin-bottom: 16px !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding-bottom: 8px !important;
        }
      
        .privacy-content h2 {
          font-size: 24px !important;
          font-weight: 600 !important;
          color: #1a202c !important;
          margin-top: 24px !important;
          margin-bottom: 12px !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding-bottom: 6px !important;
        }
      
        .privacy-content h3 {
          font-size: 20px !important;
          font-weight: 600 !important;
          color: #2d3748 !important;
          margin-top: 20px !important;
          margin-bottom: 10px !important;
        }
      
        .privacy-content h4 {
          font-size: 18px !important;
          font-weight: 500 !important;
          color: #2d3748 !important;
          margin-top: 16px !important;
          margin-bottom: 8px !important;
        }
      
        .privacy-content strong,
        .privacy-content b {
          font-weight: 700 !important;
          color: #1a202c !important;
        }
      
        .privacy-content em,
        .privacy-content i {
          font-style: italic !important;
        }
      
        .privacy-content ul {
          list-style-type: disc !important;
          margin-left: 24px !important;
          margin-bottom: 16px !important;
        }
      
        .privacy-content ol {
          list-style-type: decimal !important;
          margin-left: 24px !important;
          margin-bottom: 16px !important;
        }
      
        .privacy-content li {
          margin-bottom: 8px !important;
          line-height: 1.6 !important;
          color: #2d3748 !important;
        }
      
        .privacy-content a {
          color: #3182ce !important;
          text-decoration: underline !important;
        }
      
        .privacy-content a:hover {
          color: #2c5282 !important;
        }
      
        .privacy-content blockquote {
          border-left: 4px solid #cbd5e0 !important;
          padding-left: 16px !important;
          margin: 16px 0 !important;
          font-style: italic !important;
          color: #4a5568 !important;
        }
      
        .privacy-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 16px 0 !important;
        }
      
        .privacy-content th,
        .privacy-content td {
          border: 1px solid #e2e8f0 !important;
          padding: 12px !important;
          text-align: left !important;
        }
      
        .privacy-content th {
          background-color: #f7fafc !important;
          font-weight: 600 !important;
        }
      
        .privacy-content code {
          background-color: #edf2f7 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
      
        .privacy-content pre {
          background-color: #edf2f7 !important;
          padding: 16px !important;
          border-radius: 6px !important;
          overflow-x: auto !important;
          margin: 16px 0 !important;
        }
      
        /* Ensure proper spacing between elements */
        .privacy-content > * + * {
          margin-top: 12px !important;
        }
      
        /* First element should not have top margin */
        .privacy-content > *:first-child {
          margin-top: 0 !important;
        }
      
        /* Last element should not have bottom margin */
        .privacy-content > *:last-child {
          margin-bottom: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
  </script>
  
  <main class="container md:!mx-32  mx-auto p-4 md:py-10 py-5 ">
    <h1 class="text-3xl font-bold mb-6 text-center">Privacy Policy</h1>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="privacy-content">{@html privacyPolicy}</div>
    </div>
  </main>
  <Footer />
  <style>
    /* If you need any component-specific styles that aren't dynamic */
  </style>