package com.employee.management.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.employee.management.model.Employee;
import com.employee.management.repository.EmployeeRepository;

@Service
public class EmployeeService {
	
	@Autowired
	private EmployeeRepository repository;
	
	// Save employee
    public Employee saveEmployee(Employee employee) {
        return repository.save(employee);
    }

    // Get all employees
    public List<Employee> getAllEmployees() {
        return repository.findAll();
    }

    // Get employee by id
    public Optional<Employee> getEmployeeById(int id) {
        return repository.findById(id);
    }

    // Delete employee
    public void deleteEmployee(int id) {
        repository.deleteById(id);
    }
    
    public Employee updateEmployee(int id, Employee updatedEmployee) {

        Employee employee = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        employee.setName(updatedEmployee.getName());
        employee.setEmail(updatedEmployee.getEmail());
        employee.setDepartment(updatedEmployee.getDepartment());
        employee.setSalary(updatedEmployee.getSalary());

        return repository.save(employee);
    }


}
