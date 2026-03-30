@echo off
mkdir src
cd src
dotnet new sln -n AITutor
dotnet new classlib -n AITutor.Domain
dotnet new classlib -n AITutor.Application
dotnet new classlib -n AITutor.Infrastructure
dotnet new webapi -n AITutor.API
dotnet new blazorwasm -n AITutor.Frontend
dotnet sln AITutor.sln add AITutor.Domain\AITutor.Domain.csproj 
dotnet sln AITutor.sln add AITutor.Application\AITutor.Application.csproj 
dotnet sln AITutor.sln add AITutor.Infrastructure\AITutor.Infrastructure.csproj 
dotnet sln AITutor.sln add AITutor.API\AITutor.API.csproj 
dotnet sln AITutor.sln add AITutor.Frontend\AITutor.Frontend.csproj
dotnet add AITutor.Application\AITutor.Application.csproj reference AITutor.Domain\AITutor.Domain.csproj
dotnet add AITutor.Infrastructure\AITutor.Infrastructure.csproj reference AITutor.Application\AITutor.Application.csproj AITutor.Domain\AITutor.Domain.csproj
dotnet add AITutor.API\AITutor.API.csproj reference AITutor.Application\AITutor.Application.csproj AITutor.Infrastructure\AITutor.Infrastructure.csproj
echo Setup complete
