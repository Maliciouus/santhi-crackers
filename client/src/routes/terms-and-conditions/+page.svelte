<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { _axios } from '$lib/_axios';
    import { onMount } from 'svelte';
	import Footer from '$lib/components/footer.svelte';
  
    let termsAndConditions = '';
  
    onMount(async() => {
        try {
            injectStyles();
            const response = await _axios.get('/termsandconditions');
            if (response.data.status) {
                termsAndConditions = formatContent(response.data.data.content);
            } else {
                termsAndConditions = '<p>Failed to load terms and conditions.</p>';
            }
        } catch (error) {
            console.error('Error fetching terms and conditions:', error);
            termsAndConditions = '<p>Error loading terms and conditions.</p>';
        }
    });
    function formatContent(content :any) {
        if (!content) return '';
        // First convert \n\n to paragraphs
        let formatted = content.replace(/\n\n+/g, '</p><p>');
        // Then convert single \n to line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        // Ensure we have proper paragraph tags
        if (!formatted.startsWith('<p>')) formatted = '<p>' + formatted;
        if (!formatted.endsWith('</p>')) formatted = formatted + '</p>';
        return formatted;
    }

    function injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .tc-content {
          line-height: 1.8 !important;
          color: #2d3748 !important;
          font-size: 16px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      
        /* Force override any existing styles */
        .tc-content * {
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
      
        /* Typography styles that override Tailwind */
        .tc-content p {
          margin-bottom: 16px !important;
          line-height: 1.7 !important;
          color: #2d3748 !important;
          font-size: 16px !important;
        }
      
        .tc-content h1 {
          font-size: 32px !important;
          font-weight: 900 !important;
          color: #1a202c !important;
          margin-top: 32px !important;
          margin-bottom: 16px !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding-bottom: 8px !important;
        }
      
        .tc-content h2 {
          font-size: 24px !important;
          font-weight: 600 !important;
          color: #1a202c !important;
          margin-top: 24px !important;
          margin-bottom: 12px !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding-bottom: 6px !important;
        }
      
        .tc-content h3 {
          font-size: 20px !important;
          font-weight: 600 !important;
          color: #2d3748 !important;
          margin-top: 20px !important;
          margin-bottom: 10px !important;
        }
      
        .tc-content h4 {
          font-size: 18px !important;
          font-weight: 500 !important;
          color: #2d3748 !important;
          margin-top: 16px !important;
          margin-bottom: 8px !important;
        }
      
        .tc-content strong,
        .tc-content b {
          font-weight: 700 !important;
          color: #1a202c !important;
        }
      
        .tc-content em,
        .tc-content i {
          font-style: italic !important;
        }
      
        .tc-content ul {
          list-style-type: disc !important;
          margin-left: 24px !important;
          margin-bottom: 16px !important;
        }
      
        .tc-content ol {
          list-style-type: decimal !important;
          margin-left: 24px !important;
          margin-bottom: 16px !important;
        }
      
        .tc-content li {
          margin-bottom: 8px !important;
          line-height: 1.6 !important;
          color: #2d3748 !important;
        }
      
        .tc-content a {
          color: #3182ce !important;
          text-decoration: underline !important;
        }
      
        .tc-content a:hover {
          color: #2c5282 !important;
        }
      
        .tc-content blockquote {
          border-left: 4px solid #cbd5e0 !important;
          padding-left: 16px !important;
          margin: 16px 0 !important;
          font-style: italic !important;
          color: #4a5568 !important;
        }
      
        .tc-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 16px 0 !important;
        }
      
        .tc-content th,
        .tc-content td {
          border: 1px solid #e2e8f0 !important;
          padding: 12px !important;
          text-align: left !important;
        }
      
        .tc-content th {
          background-color: #f7fafc !important;
          font-weight: 600 !important;
        }
      
        .tc-content code {
          background-color: #edf2f7 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
      
        .tc-content pre {
          background-color: #edf2f7 !important;
          padding: 16px !important;
          border-radius: 6px !important;
          overflow-x: auto !important;
          margin: 16px 0 !important;
        }
      
        /* Ensure proper spacing between elements */
        .tc-content > * + * {
          margin-top: 12px !important;
        }
      
        /* First element should not have top margin */
        .tc-content > *:first-child {
          margin-top: 0 !important;
        }
      
        /* Last element should not have bottom margin */
        .tc-content > *:last-child {
          margin-bottom: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
</script>
  

  <main class="container md:!mx-32  mx-auto p-4 md:py-10 py-5">
    <h1 class="text-3xl font-bold mb-6 text-center">Terms and Conditions</h1>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="tc-content">{@html termsAndConditions}</div>
    </div>
  </main>
  
<Footer  />