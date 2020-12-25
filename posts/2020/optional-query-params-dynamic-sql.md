---
title: Optional Query Params via Dynamic SQL
shortDescription: When building APIs, we typically provide the ability to sort or filter data on GET operations via query parameters. While building basic query parameters in Mulesoft is simple, expanding your API to support optional and repeatable parameters can seem daunting when you're new to the platform. We will be building a simplistic Product System API in order to demo optional and repeatable query params. To accomplish this, we will be building dynamic (parameterized) SQL, and as a bonus wrapping this functionality into a reusable library.
published: true
date: 2020-12-25
tags: [dataweave, mule 4, sql]
---

# Overview

> #### What you need:

- [Anypoint Studio](https://www.mulesoft.com/lp/dl/studio).
- Anypoint Platform Account - [sign up for a trial](https://anypoint.mulesoft.com/login/signup?apintent=generic)

> #### What you will build

> We will be utilizing a MySQL database in order to build a Product System API, which we will publish to Exchange in order to utilize scaffolding; given that the focus of this article is query parameters, we will only be implementing the `GET` operation on the `/products` endpoint.

# API Specification

1. Log into [https://anypoint.mulesoft.com](https://anypoint.mulesoft.com).
2. Navigate to design center
3. Click `+ Create New` and select `New API Spec`
4. Give the API a title; `Product Syste API`
5. In this case, our focus isn't on designing the API itself, so choose to use `RAML 1.0` rather than the visual editor. I will be providing you the starting RAML.

![create-product-api-spec.gif](../../images/create-product-api-spec.gif)

6. Complete API specification. To start, copy the code below into your specification.

```RAML
#%RAML 1.0
title: Product System API

types:
  Product:
    type: object
    properties:
      id: number
      name: string
      description: string
      productNumber: number
      manufactured: boolean
      colors: string[]
      categories: string[]
      stock: number
      safetyStockLevel: number
      standardCost: number
      listPrice: number
      size: string
      sizeUnitMeasure: string
      weight: number
      weightUnitMeasureCode: string
      daysToManufacture: number
      images: string[]
      modifiedDate: date-only
      createdDate: date-only

/producst:
  get:
    description: Returns a list of Products
    responses:
      200:
        body:
          application/json:
            type: Product[]
```

This gives us our basic API which returns a list of products, but it would be nice to be able to filter things! Our products have a field called `weightUnitMeasureCode`, and it would be very useful to be able to filter by this code. A simple implementation might look like:

```RAML
...
  queryParameters:
    weightUnitMeasureCode:
      type: string
      required: false
```

The disadvantage here though is we can only filter by a single `weightUnitMeasureCode`! It would be nice to be able to specify multiple, ie: `?weightUnitMeasureCode=lb&weightUnitMeasureCode=oz`. Thankfully, query parameters can be specified as repeatable. Lets go ahead and add this to our spec now:

```RAML {diff}
/producst: // L28
  get:
    description: Returns a list of Products
+     queryParameters:
+       weightUnitMeasureCode:
+         type: string[]
+         required: false
    responses:
      200:
        body:
          application/json:
            type: Product[]
```

Another prime candidate for a query parameter is the field `manufactured`. By default, we won't be filtering any products, so lets go ahead and add this field as an optional field:

```RAML {diff}
    queryParameters: // L31
      weightUnitMeasureCode:
        type: string[]
        required: false
+       manufactured:
+         type: boolean
+         required: false
```

7. Publish to exchange - now that we've finished the spec we're going to use, click `Publish` in the top right and then `Publish to Exchange`. Set the asset version to `1.0.0` and API version to `v1`.
8. Your published API specification should [look like this](https://anypoint.mulesoft.com/exchange/portals/mulesoft-6908/a50f9c0b-44f1-4399-aec5-e75db80327b1/product-system-api/).

# Implementation

Now that we've built our API specification, we can open studio and scaffold our API and provide implementation logic.

### Create Project

1. Open Anypoint Studio
2. Create a new project called 'Product System API'
3. Click the `+` button to add an API from exchange to the project.
4. Sign into your platform account and search for 'Product System API'
5. Create project and scaffold

![create-product-api-project.gif](../../images/create-product-api-project.gif)

### Setup MySQL Connection

1. In `src/main/resources`, create a new file called config.yaml
2. Copy the following code into config.yaml:

```yaml
mysql:
  host: 'services.mythicalcorp.com'
  port: '3306'
  user: 'product'
  password: 'Mule1379'
  database: 'products_test'
```

3. In the mule palette, click `Add Modules`, and drag the `Database` connector into the blue box.
4. Click on the `Global Elements` tab
5. Click `Create` and search for `config`. Select `Configuration properties`
6. Type `config.yaml` in for the file.
7. Click `Create` and search for `database`. Select `Database config`
8. In the connection dropdown, select `MySQL Connection`
9. Under required libraries, click `Configure` and then click `Add recommended libraries`
10. Fill in the following fields:
    - Host: `${mysql.host}`
    - Port: `${mysql.port}`
    - User: `${mysql.user}`
    - Password: `${mysql.password}` (**tip:** Click on the show password checkbox)
    - Database: `${mysql.database}`
11. Click on `Test connection` to verify connectivity.

![setup-mysql-database-config.gif](../../images/setup-mysql-database-config.gif)

### Create Basic Select and Map Data

Now that we have our connectivity setup, we can create the basic implementation of our endpoint: select everything and map to our canonical data model.

1. Find the flow `get:\producst:product-system-api-config` and delete the components
2. In the mule palette, select `Database` and drag a `Select` operation into the flow
3. Select `Database_Config` in the `Connector configuration` dropdown
4. Paste the following SQL into `SQL Query Text` (_don't worry, we will walk through converting this to be dynamic later_)

```sql
SELECT
  p.id, p.name, p.description, p.product_number, p.manufactured, p.colors, p.categories, p.stock, p.safety_stock_level, p.standard_cost, p.list_price, p.size, p.size_unit_measure_code, p.weight, p.weight_unit_measure_code, p.days_to_manufacture, p.images,  p.modified_date, p.created_date
FROM 
  product p
```

5. In the mule palette, find a `Transform Message` component and add it after our `Select` component. We need to map our data to our canonical model defined in our spec.
6. The `Transform Message` component should have automatically discovered the metadata; you can now drag and drop the fields to map. Go ahead and map a few fields to give it a try, and then replace the automatically generated data-weave with this code below:

```data-weave
%dw 2.0
output application/json
---
payload map ( payload01 , indexOfPayload01 ) -> {
  weightUnitMeasureCode: payload01.weight_unit_measure_code default "",
  images: (payload01.images default "") splitBy ",",
  safetyStockLevel: payload01.safety_stock_level,
  description: payload01.description,
  weight: payload01.weight default 0,
  productNumber: payload01.product_number as Number,
  colors: (payload01.colors default "") splitBy ",",
  standardCost: payload01.standard_cost,
  createdDate: payload01.created_date as String,
  size: payload01.size default "",
  sizeUnitMeasure: payload01.size_unit_measure_code default "",
  name: payload01.name,
  modifiedDate: payload01.modified_date as String default "",
  daysToManufacture: payload01.days_to_manufacture,
  id: payload01.id,
  categories: (payload01.categories default "") splitBy ",",
  stock: payload01.stock default 0,
  manufactured: payload01.manufactured,
  listPrice: payload01.list_price
}
```

7. Start the app, open the console, and test your api! You should be getting back all Products in the database without any filtering.

![product-api-setup-sql-select.gif](../../images/product-api-setup-sql-select.gif)

### Building Dynamic Parameterized SQL