import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock patient data for testing
const mockPatients = [
  {
    id: 1,
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 30.5,
    owner: 'John Smith',
    phone: '555-0123',
    email: 'john.smith@email.com',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Whiskers',
    species: 'Cat',
    breed: 'Persian',
    age: 2,
    weight: 4.2,
    owner: 'Jane Doe',
    phone: '555-0456',
    email: 'jane.doe@email.com',
    createdAt: '2024-02-20T14:30:00Z'
  },
  {
    id: 3,
    name: 'Charlie',
    species: 'Dog',
    breed: 'Labrador',
    age: 5,
    weight: 28.0,
    owner: 'Bob Johnson',
    phone: '555-0789',
    email: 'bob.johnson@email.com',
    createdAt: '2024-03-10T09:15:00Z'
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (method) {
    case 'GET':
      // Return all patients or filter by query params
      const { search } = req.query;
      let patients = mockPatients;
      
      if (search && typeof search === 'string') {
        patients = mockPatients.filter(patient => 
          patient.name.toLowerCase().includes(search.toLowerCase()) ||
          patient.owner.toLowerCase().includes(search.toLowerCase()) ||
          patient.species.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      res.status(200).json({
        success: true,
        data: patients,
        total: patients.length,
        message: 'Patients retrieved successfully (mock data)'
      });
      break;

    case 'POST':
      // Mock creating a new patient
      const newPatient = {
        id: mockPatients.length + 1,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        data: newPatient,
        message: 'Patient created successfully (mock data)'
      });
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
      res.status(405).json({
        success: false,
        message: `Method ${method} not allowed`
      });
      break;
  }
}