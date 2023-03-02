import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Dropzone from "react-dropzone";
import { useTable } from "react-table";

const App = () => {
  const [patientName, setPatientName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [test, setTest] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [file, setFile] = useState(null);
  const [patients, setPatients] = useState([]);

  // Define the columns for the patient data table
  const columns = React.useMemo(
    () => [
      { Header: "ID", accessor: "id" },
      { Header: "Patient Name", accessor: "patient_name" },
      { Header: "Symptoms", accessor: "symptoms" },
      { Header: "Test", accessor: "test" },
      { Header: "Diagnosis", accessor: "diagnosis" },
      {
        Header: "File",
        accessor: "file_path",
        Cell: ({ value }) => (
          <a href={`http://localhost:3000/file/${value}`} download>
            {" "}
            Download{" "}
          </a>
        ),
      },
    ],
    []
  );

  // Define the data for the patient data table
  const data = React.useMemo(() => patients, [patients]);

  // Use react-table to create the patient data table
  const tableInstance = useTable({ columns, data });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  // Function to handle form submission and file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("patient_name", patientName);
    formData.append("symptoms", symptoms);
    formData.append("test", test);
    formData.append("diagnosis", diagnosis);
    formData.append("file", file);
    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData
      );
      console.log(response.data.message);
      // Refresh the patient data table after upload
      const patientsResponse = await axios.get(
        "http://localhost:3000/patients"
      );
      setPatients(patientsResponse.data.patients);
    } catch (error) {
      console.error(error);
    }
  };

  // Function to handle file selection
  const handleFileSelect = (files) => {
    setFile(files[0]);
  };

  // Function to fetch patient data from the server
  const fetchPatients = async () => {
    try {
      const response = await axios.get("http://localhost:3000/patients");
      setPatients(response.data.patients);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="patientName">Patient Name:</label>
          <input
            type="text"
            id="patientName"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="symptoms">Symptoms:</label>
          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="test">Test:</label>
          <input
            type="text"
            id="test"
            value={test}
            onChange={(e) => setTest(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="diagnosis">Diagnosis:</label>
          <input
            type="text"
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="file">File:</label>
          <Dropzone onDrop={handleFileSelect}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} className="dropzone">
                <input {...getInputProps()} />
                <p>Drag and drop a file here, or click to select file</p>
                {file && <p>{file.name}</p>}
              </div>
            )}
          </Dropzone>
        </div>
        <button type="submit">Submit</button>
      </form>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default App;
