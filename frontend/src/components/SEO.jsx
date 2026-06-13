import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, schema }) => {
  return (
    <Helmet>
      {title && <title>{title}</title>}
      {title && <meta property="og:title" content={title} />}
      {title && <meta name="twitter:title" content={title} />}
      
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:description" content={description} />}
      {description && <meta name="twitter:description" content={description} />}
      
      {keywords && <meta name="keywords" content={keywords} />}
      
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
