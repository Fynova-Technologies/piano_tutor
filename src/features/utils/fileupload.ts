
const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  setUploadError: React.Dispatch<React.SetStateAction<string | null>>,
  setUploadLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setUploadedMusicXML: React.Dispatch<React.SetStateAction<string | null>>,
  setShowUploadPanel: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PNG, JPG, or PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }
    setUploadLoading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });
      // const data = await response.json();Episode 95
      const raw = await response.text();
      console.log("RAW RESPONSE:", raw);

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error("API did not return JSON. Raw response:\n" + raw);
      }


      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      // Store the MusicXML content
      setUploadedMusicXML(data.musicxml);
      setShowUploadPanel(false); // Hide upload panel after success
      
      console.log('✅ MusicXML uploaded successfully');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setUploadError(err.message || 'Failed to convert sheet music');
      console.error('Upload error:', err);
    } finally {
      setUploadLoading(false);
    }
  };

export default handleFileUpload;