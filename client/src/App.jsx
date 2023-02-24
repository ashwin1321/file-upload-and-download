import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  // Handle file change
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle form submit
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      alert("Please select a file");
    } else {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios({
          method: "post",
          url: "http://localhost:3000/upload",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: false,
        });

        console.log(response.data);
        // Reload files
        fetchFiles();
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Fetch files from server
  const fetchFiles = async () => {
    try {
      const response = await axios({
        method: "get",
        url: "http://localhost:3000/files",
        withCredentials: false,
      });

      setFiles(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Download file
  const handleDownload = async (id, filename) => {
    try {
      const response = await axios({
        method: "get",
        url: `http://localhost:3000/download/${id}`,
        responseType: "blob",
        withCredentials: false,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" name="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Filename</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.id}</td>
              <td>{file.name}</td>
              <td>
                <button onClick={() => handleDownload(file.id, file.name)}>
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
