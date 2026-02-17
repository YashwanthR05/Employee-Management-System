package com.employee.management.controlller;

import java.awt.PageAttributes.MediaType;
import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.employee.management.dto.EmployeeRequest;
import com.employee.management.exception.BadRequestException;
import com.employee.management.model.Employee;
import com.employee.management.service.EmployeeService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/employees")
public class EmployeeController {
	
	@Autowired
	private EmployeeService service;
	
	@PostMapping
	public Employee addEmployee(
	        @Valid @ModelAttribute EmployeeRequest req,
	        @RequestParam(value = "photo", required = false) MultipartFile photo
	) throws IOException {

	    if (photo == null || photo.isEmpty()) {
	        throw new BadRequestException("photo is required");
	    }

	    Employee employee = new Employee();
	    employee.setName(req.getName().trim());
	    employee.setEmail(req.getEmail().trim());
	    employee.setDepartment(req.getDepartment().trim());
	    employee.setSalary(req.getSalary());
	    employee.setPhoto(photo.getBytes());

	    return service.saveEmployee(employee);
	}


	
	// Get All Employees
    @GetMapping
    public List<Employee> getAllEmployees() {
        return service.getAllEmployees();
    }

    // Get Employee by ID
    @GetMapping("/{id}")
    public Employee getEmployeeById(@PathVariable int id) {
        return service.getEmployeeById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    // Delete Employee
    @DeleteMapping("/{id}")
    public String deleteEmployee(@PathVariable int id) {
        service.deleteEmployee(id);
        return "Employee deleted successfully";
    }
    
    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getEmployeePhoto(@PathVariable int id) {

        Employee employee = service.getEmployeeById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(employee.getPhoto());
    }
    
    @PutMapping("/{id}")
    public Employee updateEmployee(@PathVariable int id,
                                   @Valid @RequestBody Employee employee) {
        return service.updateEmployee(id, employee);
    }
    
    @GetMapping("/search")
    public List<Employee> search(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String name
    ) {
        if (department != null && !department.trim().isEmpty()) {
            return service.searchByDepartment(department.trim());
        }
        if (name != null && !name.trim().isEmpty()) {
            return service.searchByName(name.trim());
        }
        return service.getAllEmployees();
    }
    
    @PutMapping("/{id}/photo")
    public Employee updatePhoto(
            @PathVariable int id,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) throws IOException {

        if (photo == null || photo.isEmpty()) {
            throw new com.employee.management.exception.BadRequestException("photo is required");
        }
        return service.updateEmployeePhoto(id, photo.getBytes());
    }



}
