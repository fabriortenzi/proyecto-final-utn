import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ValidatorsService } from '../services/validators.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from '../entities/product.entity';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-shop-modify-product',
  templateUrl: './shop-modify-product.component.html',
  styleUrls: ['./shop-modify-product.component.scss']
})
export class ShopModifyProductComponent {

  shopModifyProductForm : FormGroup;
  photoTouched: boolean = false;
  validPhoto: boolean = null;
  submitted: boolean = false;
  productId:string;
  photo: File=null;
  
  product: any;

  constructor(private router : Router, private validator : ValidatorsService, private productService :ProductService, private location: Location){
    this.productId = sessionStorage.getItem('productId');
  }

  ngOnInit() {
      this.shopModifyProductForm = new FormGroup({
        name: new FormControl('', [Validators.required, this.validator.validateMaxCharString(30)]),
        description: new FormControl('', [Validators.required, this.validator.validateMaxCharString(75)]),
        amount: new FormControl('', [Validators.required,this.validator.validatePrice()]),
        validSince: new FormControl({value: this.validator.getTodayDate(),disabled : false}, [Validators.required, this.validator.validateFutureDate()]) 
      })

      this.productService.getOne(this.productId).subscribe(product => {
        this.product = product;
        this.shopModifyProductForm.patchValue({
          name: product.name,
          description: product.description,
          amount: product.prices[0].amount,
          validSince: new Date(product.prices[0].validSince).toISOString().split('T')[0]
        });
      });
    }

  getName(){
      return this.shopModifyProductForm.get('name');
  }

  getDescription(){
      return this.shopModifyProductForm.get('description');
  }

  getAmount(){
      return this.shopModifyProductForm.get('amount');
  }

  getValidSince(){
      return this.shopModifyProductForm.get('validSince');
  }

  onPhotoSelected(event){
      this.validPhoto = this.validator.validateImageFormat(event.target.files[0]);
      if(this.validPhoto){
        this.photo = event.target.files[0];
    }
      this.photoTouched = true;
    }
  
  submit(){
      this.submitted=true;
      if(this.validPhoto && this.shopModifyProductForm.valid){
        const product : Product = {
          id: this.productId,
          name : this.shopModifyProductForm.get('name').value,
          description: this.shopModifyProductForm.get('description').value,
          price: this.shopModifyProductForm.get('amount').value,
          validSince: this.shopModifyProductForm.get('validSince').value,
          photo: this.photo
        }

        this.productService.update(product).subscribe(() =>{
          this.router.navigate(['/home-shop']);
        })
        }
  }

  toggleEnabled(){
    this.productService.toggleEnabled(this.productId).subscribe((response) =>{
      this.product.enabled = response.data.enabled;
    })
  }

  goBack() {
    this.location.back();
  }
}